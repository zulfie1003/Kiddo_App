/**
 * ACTION DISPATCHER — Universal Command Bus
 *
 * WHY CENTRALIZED DISPATCH:
 * UI components should be "dumb renderers." They emit actions.
 * They never contain business logic (cart logic, navigation, analytics).
 * This separation means:
 * 1. Components are fully testable with mock dispatchers
 * 2. Business logic changes don't require touching UI files
 * 3. A single place to add logging, analytics, A/B testing
 *
 * PATTERN: Command Pattern + Mediator Pattern
 * - Command: SDUIAction is a serializable command
 * - Mediator: ActionDispatcher routes commands to handlers
 *
 * WHY CONTEXT:
 * The dispatcher needs to access Zustand store, navigation,
 * and campaign context. Context provides these without prop-drilling.
 */

import React, { createContext, useCallback, useContext } from 'react';
import { Linking, Alert } from 'react-native';

import type {
  SDUIAction,
  AddToCartAction,
  RemoveFromCartAction,
  DeepLinkAction,
  ApplyMysteryGiftCouponAction,
  CartState,
} from '@/types/sdui.types';
import { useCartStore } from '@store/CartStore';
import { useCampaignContext } from '@engine/campaign/CampaignEngine';
import { useOverlayEngine } from '@engine/overlay/OverlayEngine';

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

interface ActionDispatcherContextValue {
  dispatch: (action: SDUIAction) => void;
}

const ActionDispatcherContext = createContext<ActionDispatcherContextValue | null>(null);

// ─────────────────────────────────────────────
// INDIVIDUAL ACTION HANDLERS
// WHY: Each handler is isolated and unit-testable independently.
// ─────────────────────────────────────────────

/**
 * WHY useRef for handler registry:
 * Handlers close over store actions and context values.
 * If we put handlers in a plain object, they'd be recreated on
 * every render. useRef gives us a stable container that we update
 * with the latest values via a useCallback each render.
 */

function handleAddToCart(
  action: AddToCartAction,
  addToCart: CartState['addToCart']
): void {
  const { id, name, price, imageUrl, quantity = 1 } = action.payload;
  addToCart({ id, name, price, imageUrl, quantity });

  // WHY: Fire-and-forget tracking. Does not block UI.
  trackEvent('add_to_cart', { productId: id, name, price });
}

function handleRemoveFromCart(
  action: RemoveFromCartAction,
  removeFromCart: CartState['removeFromCart']
): void {
  removeFromCart(action.payload.id);
  trackEvent('remove_from_cart', { productId: action.payload.id });
}

async function handleDeepLink(action: DeepLinkAction): Promise<void> {
  const { url, params } = action.payload;

  // Build full URL with params
  const queryString = params
    ? '?' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
    : '';

  const fullUrl = `kidsapp://${url}${queryString}`;

  const canOpen = await Linking.canOpenURL(fullUrl);
  if (canOpen) {
    await Linking.openURL(fullUrl);
  } else {
    // Fallback: try as web URL
    const webUrl = `https://kidsapp.example.com${url}${queryString}`;
    await Linking.openURL(webUrl);
  }

  trackEvent('deep_link_tapped', { url, params });
}

function handleApplyMysteryGiftCoupon(action: ApplyMysteryGiftCouponAction): void {
  const { couponCode, expiresAt } = action.payload;

  // WHY Alert here and not component-level:
  // This is business logic (coupon validation, success feedback).
  // The component that triggered this knows nothing about coupons.
  Alert.alert(
    '🎁 Mystery Gift!',
    `Coupon "${couponCode}" applied! ${expiresAt ? `Expires: ${new Date(expiresAt).toLocaleDateString()}` : ''}`,
    [{ text: 'Awesome!', style: 'default' }]
  );

  trackEvent('mystery_gift_coupon_applied', { couponCode });
}

/**
 * WHY: Fire-and-forget analytics.
 * In production, replace with your analytics SDK (Segment, Amplitude, Firebase).
 * Using a separate function keeps business logic handlers clean.
 */
function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  // Production: await analytics.track(eventName, properties)
  if (__DEV__) {
    console.log(`[Analytics] ${eventName}`, properties);
  }
}

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

interface ActionDispatcherProviderProps {
  children: React.ReactNode;
}

export const ActionDispatcherProvider: React.FC<ActionDispatcherProviderProps> = ({
  children,
}) => {
  // WHY subscribing to specific store slices:
  // Only subscribe to the functions we need. This prevents
  // re-rendering this provider when cart count changes.
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const { switchCampaign } = useCampaignContext();
  const { showOverlay, hideOverlay } = useOverlayEngine();

  /**
   * WHY useCallback with comprehensive deps:
   * dispatch is passed as a prop to DynamicRenderer → every section.
   * If dispatch reference changes, every section re-renders.
   * useCallback keeps it stable across renders where deps haven't changed.
   *
   * WHY NOT useRef for dispatch:
   * We need the latest store actions in dispatch. useRef would capture
   * stale closures. useCallback with deps array is the correct pattern.
   */
  const dispatch = useCallback(
    (action: SDUIAction): void => {
      // WHY: Log every action in dev. In production, send to monitoring (Sentry).
      if (__DEV__) {
        console.log(`[ActionDispatcher] Dispatching:`, action.type, action.payload);
      }

      /**
       * WHY switch + exhaustive check:
       * The dispatcher IS the right place for a switch statement.
       * Unlike the renderer (which should never switch on component types),
       * the dispatcher's single job is routing actions to handlers.
       * TypeScript's discriminated union gives us compile-time exhaustiveness.
       */
      switch (action.type) {
        case 'ADD_TO_CART':
          handleAddToCart(action, addToCart);
          break;

        case 'REMOVE_FROM_CART':
          handleRemoveFromCart(action, removeFromCart);
          break;

        case 'DEEP_LINK':
          void handleDeepLink(action);
          break;

        case 'APPLY_MYSTERY_GIFT_COUPON':
          handleApplyMysteryGiftCoupon(action);
          break;

        case 'SWITCH_CAMPAIGN':
          switchCampaign(action.payload.campaignId);
          trackEvent('campaign_switched', { campaignId: action.payload.campaignId });
          break;

        case 'OPEN_OVERLAY':
          showOverlay(action.payload.overlayId);
          break;

        case 'CLOSE_OVERLAY':
          hideOverlay();
          break;

        case 'TRACK_EVENT':
          trackEvent(action.payload.eventName, action.payload.properties);
          break;

        default: {
          /**
           * WHY this exhaustive check:
           * TypeScript will error here if a new SDUIAction type is added
           * to the union but not handled here. Compile-time safety.
           */
          const _exhaustiveCheck: never = action;
          console.warn(
            `[ActionDispatcher] Unhandled action type:`,
            (_exhaustiveCheck as SDUIAction).type
          );
        }
      }
    },
    [addToCart, removeFromCart, switchCampaign, showOverlay, hideOverlay]
  );

  const value: ActionDispatcherContextValue = { dispatch };

  return (
    <ActionDispatcherContext.Provider value={value}>
      {children}
    </ActionDispatcherContext.Provider>
  );
};

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useActionDispatcher(): ActionDispatcherContextValue {
  const context = useContext(ActionDispatcherContext);
  if (!context) {
    throw new Error(
      '[useActionDispatcher] Must be used within ActionDispatcherProvider. ' +
        'Wrap your app root with <ActionDispatcherProvider>.'
    );
  }
  return context;
}
