/**
 * OVERLAY ENGINE
 *
 * WHY FULL_SCREEN with pointerEvents="none":
 * The overlay sits ABOVE all content but DOES NOT block touches.
 * This allows users to:
 * - See the animation (paper airplanes, confetti, water splash)
 * - Still tap buttons underneath
 * - The overlay is purely decorative
 *
 * WHY ABSOLUTE POSITIONING:
 * The overlay must cover the entire screen including the status bar.
 * Absolute positioning with top/left/right/bottom: 0 achieves this
 * without affecting the layout of underlying components.
 *
 * WHY LOTTIE:
 * - Vector-based: no pixelation on any screen density
 * - Small file size vs video
 * - Scriptable: can be controlled programmatically
 * - GPU-accelerated rendering
 *
 * WHY CACHED ASSET LOADING:
 * Lottie animations can be 50-200KB. Loading on every campaign switch
 * would cause visual delay. We preload and cache animation data.
 *
 * WHY CONTEXT (not Zustand):
 * Overlay state is UI state, not business state. It doesn't need to
 * be serialized, persisted, or accessed across many components.
 * Context is appropriate for UI-local state trees.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import type { SDUIOverlay } from '@/types/sdui.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

// ─────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────

interface OverlayEngineContextValue {
  showOverlay: (overlayId: string) => void;
  hideOverlay: () => void;
  registerOverlay: (overlay: SDUIOverlay) => void;
  activeOverlay: SDUIOverlay | null;
}

const OverlayEngineContext = createContext<OverlayEngineContextValue | null>(null);

// ─────────────────────────────────────────────
// OVERLAY CACHE
// WHY: Prevents re-downloading animation JSON on repeated shows
// ─────────────────────────────────────────────

const overlayCache = new Map<string, SDUIOverlay>();

// ─────────────────────────────────────────────
// FULL SCREEN OVERLAY COMPONENT
// ─────────────────────────────────────────────

interface FullScreenOverlayProps {
  overlay: SDUIOverlay;
  onDismiss: () => void;
}

const FullScreenOverlayView: React.FC<FullScreenOverlayProps> = React.memo(
  ({ overlay, onDismiss }) => {
    const lottieRef = useRef<LottieView>(null);

    useEffect(() => {
      lottieRef.current?.play();

      // Auto-dismiss if configured
      if (overlay.autoDismissMs) {
        const timer = setTimeout(() => {
          onDismiss();
        }, overlay.autoDismissMs);

        return (): void => clearTimeout(timer);
      }
      return undefined;
    }, [overlay.autoDismissMs, onDismiss]);

    return (
      <View
        style={[styles.overlayContainer, { zIndex: overlay.zIndex }]}
        /**
         * WHY pointerEvents="none":
         * The overlay is purely visual. Touches pass through to the
         * content below. Users can still interact with banners,
         * products, and buttons while the animation plays.
         */
        pointerEvents="none"
      >
        <DecorativeOverlayFallback overlayId={overlay.id} />
        {Platform.OS !== 'web' && (
          <LottieView
            ref={lottieRef}
            source={{ uri: overlay.animationUrl }}
            style={styles.lottie}
            autoPlay
            loop={overlay.loop}
            /**
             * WHY resizeMode="cover":
             * Ensures animation fills the screen without letterboxing,
             * similar to how a video background works.
             */
            resizeMode="cover"
            onAnimationFinish={() => {
              if (!overlay.loop) {
                onDismiss();
              }
            }}
            /**
             * WHY cacheComposition:
             * Lottie will cache the parsed animation JSON in memory.
             * Re-showing the same overlay (e.g., campaign toggle) is instant.
             */
            cacheComposition
            renderMode="AUTOMATIC"
          />
        )}
      </View>
    );
  }
);

FullScreenOverlayView.displayName = 'FullScreenOverlayView';

interface DecorativeOverlayFallbackProps {
  overlayId: string;
}

const DecorativeOverlayFallback: React.FC<DecorativeOverlayFallbackProps> = React.memo(
  ({ overlayId }) => {
    const palette =
      overlayId === 'overlay-summer-playhouse'
        ? ['#38BDF8', '#0EA5E9', '#FCD34D']
        : overlayId === 'overlay-mystery-gift'
          ? ['#DC2626', '#F59E0B', '#7C3AED']
          : ['#F5C842', '#1B4FD8', '#FFFFFF'];

    return (
      <View style={styles.fallbackLayer} pointerEvents="none">
        {Array.from({ length: 18 }).map((_, index) => {
          const size = 8 + (index % 4) * 5;
          return (
            <View
              key={`${overlayId}-${index}`}
              style={[
                styles.fallbackParticle,
                {
                  width: size,
                  height: overlayId === 'overlay-mystery-gift' ? size / 2 : size,
                  borderRadius: overlayId === 'overlay-mystery-gift' ? 2 : size / 2,
                  backgroundColor: palette[index % palette.length],
                  left: `${(index * 17) % 95}%`,
                  top: `${(index * 29) % 88}%`,
                  transform: [{ rotate: `${(index * 23) % 120}deg` }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  }
);

DecorativeOverlayFallback.displayName = 'DecorativeOverlayFallback';

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

interface OverlayEngineProviderProps {
  children: React.ReactNode;
  initialOverlays?: SDUIOverlay[];
}

export const OverlayEngineProvider: React.FC<OverlayEngineProviderProps> = ({
  children,
  initialOverlays = [],
}) => {
  const [activeOverlay, setActiveOverlay] = useState<SDUIOverlay | null>(null);
  const overlayRegistryRef = useRef<Map<string, SDUIOverlay>>(new Map());

  // Register initial overlays from payload
  useEffect(() => {
    initialOverlays.forEach((overlay) => {
      overlayRegistryRef.current.set(overlay.id, overlay);
      overlayCache.set(overlay.id, overlay);
    });
  }, [initialOverlays]);

  const registerOverlay = useCallback((overlay: SDUIOverlay) => {
    overlayRegistryRef.current.set(overlay.id, overlay);
    overlayCache.set(overlay.id, overlay);
  }, []);

  const showOverlay = useCallback((overlayId: string) => {
    const overlay =
      overlayRegistryRef.current.get(overlayId) ?? overlayCache.get(overlayId);

    if (!overlay) {
      console.warn(
        `[OverlayEngine] Overlay "${overlayId}" not found. ` +
          `Register it first with registerOverlay().`
      );
      return;
    }

    setActiveOverlay(overlay);
  }, []);

  const hideOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  const value = useMemo<OverlayEngineContextValue>(
    () => ({ showOverlay, hideOverlay, registerOverlay, activeOverlay }),
    [showOverlay, hideOverlay, registerOverlay, activeOverlay]
  );

  return (
    <OverlayEngineContext.Provider value={value}>
      {children}
      {/**
       * WHY rendered here (at provider level) not in a separate component:
       * The overlay must be the last child of the provider, ensuring it
       * renders on top of ALL content including navigation bars and modals.
       * If rendered in a specific screen component, it would be obscured
       * by navigation headers.
       */}
      {activeOverlay && (
        <FullScreenOverlayView overlay={activeOverlay} onDismiss={hideOverlay} />
      )}
    </OverlayEngineContext.Provider>
  );
};

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useOverlayEngine(): OverlayEngineContextValue {
  const context = useContext(OverlayEngineContext);
  if (!context) {
    throw new Error('[useOverlayEngine] Must be used within OverlayEngineProvider.');
  }
  return context;
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  lottie: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fallbackLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  fallbackParticle: {
    position: 'absolute',
  },
});
