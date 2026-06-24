/**
 * SDUI Type System
 *
 * WHY: Every piece of data flowing from backend → frontend must be
 * typed strictly. Discriminated unions ensure TypeScript narrows types
 * correctly. Runtime validation catches malformed payloads early.
 *
 * Design principle: Types mirror the backend contract exactly.
 * Frontend never assumes; it validates and renders or gracefully skips.
 */

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────

/**
 * WHY: Theme is server-driven so marketing can run campaigns
 * without an app release. All color tokens flow from here.
 */
export interface SDUITheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  error: string;
  success: string;
  cardBackground: string;
  borderColor: string;
  badgeBackground: string;
  badgeText: string;
}

// ─────────────────────────────────────────────
// ACTIONS — Discriminated Union
// ─────────────────────────────────────────────

/**
 * WHY: Discriminated union on `type` means TypeScript knows
 * the exact payload shape for each action. No type casting needed.
 * The Action Dispatcher switches on `type` and TypeScript narrows.
 */
export interface AddToCartAction {
  type: 'ADD_TO_CART';
  payload: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    quantity?: number;
  };
}

export interface RemoveFromCartAction {
  type: 'REMOVE_FROM_CART';
  payload: {
    id: string;
  };
}

export interface DeepLinkAction {
  type: 'DEEP_LINK';
  payload: {
    url: string;
    params?: Record<string, string>;
  };
}

export interface ApplyMysteryGiftCouponAction {
  type: 'APPLY_MYSTERY_GIFT_COUPON';
  payload: {
    couponCode: string;
    expiresAt?: string;
  };
}

export interface OpenOverlayAction {
  type: 'OPEN_OVERLAY';
  payload: {
    overlayId: string;
  };
}

export interface CloseOverlayAction {
  type: 'CLOSE_OVERLAY';
  payload: Record<string, never>;
}

export interface SwitchCampaignAction {
  type: 'SWITCH_CAMPAIGN';
  payload: {
    campaignId: string;
  };
}

export interface TrackEventAction {
  type: 'TRACK_EVENT';
  payload: {
    eventName: string;
    properties?: Record<string, unknown>;
  };
}

export type SDUIAction =
  | AddToCartAction
  | RemoveFromCartAction
  | DeepLinkAction
  | ApplyMysteryGiftCouponAction
  | OpenOverlayAction
  | CloseOverlayAction
  | SwitchCampaignAction
  | TrackEventAction;

// ─────────────────────────────────────────────
// OVERLAY
// ─────────────────────────────────────────────

/**
 * WHY: Overlays are fully backend-controlled. The backend sends
 * the animation URL and duration. The frontend just renders it.
 * This allows seasonal animations without app updates.
 */
export interface SDUIOverlay {
  id: string;
  type: 'FULL_SCREEN_OVERLAY' | 'BANNER_OVERLAY' | 'BOTTOM_SHEET_OVERLAY';
  /**
   * camelCase form used internally.
   * WHY BOTH: The assignment spec defines the backend payload as:
   *   { "type": "FULL_SCREEN_OVERLAY", "animation_url": "https://..." }
   * We normalise to camelCase on ingest (see normaliseOverlay below).
   * animationUrl is the canonical internal field.
   */
  animationUrl: string;
  durationMs: number;
  loop: boolean;
  dismissible: boolean;
  /** If set, overlay auto-dismisses after N ms */
  autoDismissMs?: number;
  zIndex: number;
  /** Action to fire when overlay is dismissed */
  onDismissAction?: SDUIAction;
}

/**
 * WHY: Backend sends snake_case JSON. TypeScript + JSON.parse gives us the
 * raw object. This transformer normalises the overlay from wire format to
 * our internal camelCase SDUIOverlay shape.
 *
 * Wire format (exactly as per assignment doc):
 *   { "type": "FULL_SCREEN_OVERLAY", "animation_url": "https://..." }
 *
 * Internal format:
 *   { type: "FULL_SCREEN_OVERLAY", animationUrl: "https://..." }
 */
export interface RawOverlayPayload {
  type: SDUIOverlay['type'];
  /** snake_case as sent by backend */
  animation_url: string;
  id?: string;
  duration_ms?: number;
  loop?: boolean;
  dismissible?: boolean;
  auto_dismiss_ms?: number;
  z_index?: number;
}

export function normaliseOverlay(raw: RawOverlayPayload): SDUIOverlay {
  return {
    id: raw.id ?? `overlay-${Date.now()}`,
    type: raw.type,
    animationUrl: raw.animation_url,
    durationMs: raw.duration_ms ?? 3000,
    loop: raw.loop ?? false,
    dismissible: raw.dismissible ?? true,
    autoDismissMs: raw.auto_dismiss_ms,
    zIndex: raw.z_index ?? 999,
  };
}

// ─────────────────────────────────────────────
// CAMPAIGN
// ─────────────────────────────────────────────

/**
 * WHY: Campaigns encapsulate theme + overlay + dedicated rows.
 * Switching campaigns at runtime changes all three atomically.
 */
export type CampaignId =
  | 'back_to_school'
  | 'summer_playhouse'
  | 'mystery_gift_carnival'
  | 'default';

export interface SDUICampaign {
  id: CampaignId;
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  theme: SDUITheme;
  overlay?: SDUIOverlay;
  /** Section types that are injected when this campaign is active */
  dedicatedSectionIds: string[];
  /** Banner text shown in campaign mode */
  bannerText?: string;
  bannerAction?: SDUIAction;
}

// ─────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────

export interface SDUIProduct {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  unit: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  tags?: string[];
  /** Action fired when tapping the product card */
  onTapAction: SDUIAction;
  /** Action fired when tapping Add to Cart */
  onAddToCartAction: AddToCartAction;
}

// ─────────────────────────────────────────────
// BANNER
// ─────────────────────────────────────────────

export interface SDUIBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaAction?: SDUIAction;
  /** Aspect ratio for correct pre-allocation (prevents layout shift) */
  aspectRatio: number;
  backgroundColor?: string;
}

// ─────────────────────────────────────────────
// COMPONENT SECTIONS — Discriminated Union
// ─────────────────────────────────────────────

/**
 * WHY: Every section from the backend has a `type` field.
 * The ComponentRegistry maps `type` → React component.
 * Unknown types are logged and skipped without crashing.
 */

export interface BannerHeroSection {
  type: 'BANNER_HERO';
  id: string;
  banners: SDUIBanner[];
  autoScrollMs?: number;
  showDots: boolean;
}

export interface ProductGrid2x2Section {
  type: 'PRODUCT_GRID_2X2';
  id: string;
  title: string;
  subtitle?: string;
  products: SDUIProduct[];
  viewAllAction?: SDUIAction;
}

export interface DynamicCollectionSection {
  type: 'DYNAMIC_COLLECTION';
  id: string;
  title: string;
  subtitle?: string;
  products: SDUIProduct[];
  layout: 'horizontal' | 'vertical';
  cardStyle: 'compact' | 'large' | 'featured';
  viewAllAction?: SDUIAction;
  /** Campaign-specific dedicated row flag */
  isCampaignRow?: boolean;
  campaignId?: CampaignId;
}

export interface HeaderBannerSection {
  type: 'HEADER_BANNER';
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  action?: SDUIAction;
}

export interface CategoryGridSection {
  type: 'CATEGORY_GRID';
  id: string;
  title: string;
  categories: Array<{
    id: string;
    name: string;
    imageUrl: string;
    action: SDUIAction;
    backgroundColor?: string;
  }>;
  columns: number;
}

export interface FlashSaleSection {
  type: 'FLASH_SALE';
  id: string;
  title: string;
  endsAtMs: number;
  products: SDUIProduct[];
  badgeColor?: string;
}

export interface SpacerSection {
  type: 'SPACER';
  id: string;
  height: number;
}

export interface DividerSection {
  type: 'DIVIDER';
  id: string;
  color?: string;
  thickness?: number;
  marginVertical?: number;
}

/**
 * WHY: Union of all known section types.
 * The renderer checks this. Unknown types → graceful skip.
 */
export type SDUISection =
  | BannerHeroSection
  | ProductGrid2x2Section
  | DynamicCollectionSection
  | HeaderBannerSection
  | CategoryGridSection
  | FlashSaleSection
  | SpacerSection
  | DividerSection;

/** All valid section type strings */
export type SDUISectionType = SDUISection['type'];

// ─────────────────────────────────────────────
// HOME PAGE PAYLOAD — Root Contract
// ─────────────────────────────────────────────

/**
 * WHY: The root payload is the single source of truth.
 * Everything the app renders comes from here.
 * Version field allows schema migrations.
 */
export interface HomePagePayload {
  version: string;
  fetchedAt: string;
  ttlMs: number;
  theme: SDUITheme;
  campaign?: SDUICampaign;
  overlay?: SDUIOverlay;
  sections: SDUISection[];
  /** Available campaigns the client can switch to */
  availableCampaigns?: SDUICampaign[];
}

// ─────────────────────────────────────────────
// RUNTIME VALIDATION
// ─────────────────────────────────────────────

/**
 * WHY: TypeScript types are compile-time only. At runtime, the
 * backend may send malformed data. These guards prevent silent
 * failures and provide actionable error messages.
 */
export function isValidSection(value: unknown): value is SDUISection {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return typeof obj['type'] === 'string' && typeof obj['id'] === 'string';
}

export function isValidTheme(value: unknown): value is SDUITheme {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  const required: (keyof SDUITheme)[] = [
    'primary',
    'secondary',
    'background',
    'surface',
    'textPrimary',
    'textSecondary',
    'accent',
    'error',
    'success',
    'cardBackground',
    'borderColor',
    'badgeBackground',
    'badgeText',
  ];
  return required.every((key) => typeof obj[key] === 'string');
}

export function isValidHomePagePayload(value: unknown): value is HomePagePayload {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['version'] === 'string' &&
    Array.isArray(obj['sections']) &&
    isValidTheme(obj['theme'])
  );
}

// ─────────────────────────────────────────────
// CART TYPES
// ─────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface CartState {
  items: Record<string, CartItem>;
  count: number;
  totalPrice: number;
  addToCart: (product: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  clearCart: () => void;
}

// ─────────────────────────────────────────────
// COMPONENT REGISTRY TYPES
// ─────────────────────────────────────────────

/**
 * WHY: The registry maps section type strings to React components.
 * Using a Record instead of switch statements means:
 * 1. O(1) lookup vs O(n) switch
 * 2. Easy to add new types without touching renderer
 * 3. Tree-shakeable — unused components can be lazy-loaded
 */
export type RegistryComponent<T extends SDUISection = SDUISection> = React.ComponentType<{
  section: T;
  onAction: (action: SDUIAction) => void;
}>;

export type ComponentRegistry = Partial<Record<SDUISectionType, RegistryComponent<never>>>;
