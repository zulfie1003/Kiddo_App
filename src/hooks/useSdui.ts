/**
 * useHomepagePayload — Data Fetching Hook
 *
 * WHY A DEDICATED HOOK:
 * Separates data fetching from rendering. The screen component
 * shouldn't know about fetch logic, retry strategies, or caching.
 *
 * In production, replace the mock with an actual API call.
 * The hook API remains the same — screens don't change.
 *
 * WHY TTL-BASED CACHE:
 * Homepage payloads change every few minutes (promotions, stock).
 * TTL from the backend (ttlMs) tells us how long to cache.
 * After TTL expires, next mount re-fetches.
 *
 * WHY NO SUSPENSE:
 * Suspense for data fetching works best with React Query or SWR.
 * For a production app, integrate react-query here:
 *   const { data, isLoading } = useQuery(['homepage'], fetchHomepage)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { HomePagePayload} from '@/types/sdui.types';
import { isValidHomePagePayload } from '@/types/sdui.types';
import { MOCK_HOMEPAGE_PAYLOAD } from '@mocks/homePagePayload';

interface UseHomepagePayloadResult {
  payload: HomePagePayload | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const cache: { data: HomePagePayload | null; fetchedAt: number } = {
  data: null,
  fetchedAt: 0,
};

/**
 * Simulate API fetch. Replace with real endpoint in production.
 */
async function fetchHomepagePayload(): Promise<HomePagePayload> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  // In production:
  // const response = await fetch('https://api.kidsapp.com/v1/homepage');
  // const json = await response.json();

  const json: unknown = MOCK_HOMEPAGE_PAYLOAD;

  if (!isValidHomePagePayload(json)) {
    throw new Error('Invalid homepage payload from server');
  }

  return json;
}

export function useHomepagePayload(): UseHomepagePayloadResult {
  const [payload, setPayload] = useState<HomePagePayload | null>(cache.data);
  const [isLoading, setIsLoading] = useState<boolean>(!cache.data);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPayload = useCallback(async () => {
    // Check TTL cache
    if (cache.data && Date.now() - cache.fetchedAt < cache.data.ttlMs) {
      setPayload(cache.data);
      setIsLoading(false);
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchHomepagePayload();
      cache.data = data;
      cache.fetchedAt = Date.now();
      setPayload(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[useHomepagePayload] Fetch failed:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPayload();
    return (): void => {
      abortRef.current?.abort();
    };
  }, [fetchPayload]);

  return { payload, isLoading, error, refetch: fetchPayload };
}

// ─────────────────────────────────────────────
// useCartItem — Isolated cart item hook
// ─────────────────────────────────────────────

/**
 * WHY THIS PATTERN:
 * Components that need to know "is product X in cart?" use this hook.
 * It subscribes ONLY to that product's cart data.
 * No other cart changes trigger a re-render.
 */
import { useCartStore, cartItemQuantitySelector } from '@store/CartStore';

export function useCartItem(productId: string): {
  quantity: number;
  isInCart: boolean;
} {
  const quantity = useCartStore(cartItemQuantitySelector(productId));
  return { quantity, isInCart: quantity > 0 };
}

// ─────────────────────────────────────────────
// useStableCallback — For event handlers
// ─────────────────────────────────────────────

/**
 * WHY: A version of useCallback that always uses the latest callback
 * without needing it in the dependency array.
 * Useful for event handlers that close over frequently changing values.
 *
 * Usage:
 *   const handleAction = useStableCallback((action) => {
 *     dispatch(action); // always latest dispatch
 *   });
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    (...args: Parameters<T>): ReturnType<T> => callbackRef.current(...args) as ReturnType<T>,
    []
  ) as T;
}
