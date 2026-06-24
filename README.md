# KidsQ - Server Driven UI Q-Commerce App

KidsQ is a React Native + Expo demo for a kids and baby essentials Q-commerce homepage. The app is built around a Server Driven UI (SDUI) architecture: the client receives a structured JSON payload, resolves section types through a component registry, applies server-provided theme tokens, and routes all user actions through one centralized dispatcher.

The implementation is aligned with the assignment brief: dynamic homepage rendering, resilient unknown-section handling, nested virtualized collections, live campaign switching, full-screen non-blocking overlays, OTA runtime theming, and isolated cart state updates.

## Quick Start

```bash
npm install
npm run web
```

Open:

```text
http://localhost:19000
```

Useful checks:

```bash
npm run ts:check
npm run lint
```

Current status:

- `npm run ts:check` passes.
- `npm run lint` passes with warnings only.
- Web app renders and has been verified on `http://localhost:19000`.

## Tech Stack

- Expo SDK 51
- React Native 0.74
- TypeScript strict mode
- `@shopify/flash-list` for the vertical SDUI feed and horizontal product collections
- Zustand for cart state with selector-level subscription isolation
- React Context for theme, campaign, overlay, and action dispatch engines
- `lottie-react-native` for native campaign animation overlays
- Web-safe decorative overlay fallback for browser rendering

## Implemented Assignment Requirements

| Requirement | Status | Where |
| --- | --- | --- |
| Local heavy mock JSON payload | Done | `src/mocks/homePagePayload.ts` |
| Component Registry / Factory Pattern | Done | `src/components/registry/ComponentRegistry.ts` |
| Graceful unknown component handling | Done | `resolveComponent()` + `DynamicRenderer` |
| `BANNER_HERO` | Done | `src/components/sections/BannerHero.tsx` |
| `PRODUCT_GRID_2X2` | Done | `src/components/sections/ProductGrid2x2.tsx` |
| `DYNAMIC_COLLECTION` | Done | `src/components/sections/DynamicCollection.tsx` |
| Single vertical virtualized feed | Done | `src/components/registry/DynamicRenderer.tsx` |
| Nested horizontal virtualized rows | Done | `DynamicCollection` with horizontal `FlashList` |
| Universal Action Dispatcher | Done | `src/engine/action/ActionDispatcher.tsx` |
| OTA theme injection | Done | `src/engine/theme/ThemeEngine.tsx` |
| Live campaign switching | Done | `src/engine/campaign/CampaignEngine.tsx` |
| Three campaign payloads | Done | `availableCampaigns` in `homePagePayload.ts` |
| Full-screen overlay with pass-through touches | Done | `src/engine/overlay/OverlayEngine.tsx` |
| Cart count update without global feed rerender | Done | `src/store/CartStore.ts`, `ProductCard.tsx`, `CartBadge.tsx` |

## App Entry

The app uses a normal Expo `App.tsx` entry:

```json
{
  "main": "node_modules/expo/AppEntry.js"
}
```

`app/index.tsx` re-exports `App.tsx` so the real app still appears if tooling accidentally enters through the Expo Router-style `app/` path.

## Architecture

```text
App.tsx
└── ThemeProvider
    └── OverlayEngineProvider
        └── CampaignProvider
            └── ActionDispatcherProvider
                └── HomeScreen
                    └── DynamicRenderer
                        └── FlashList sections
                            ├── BANNER_HERO
                            ├── CATEGORY_GRID
                            ├── HEADER_BANNER
                            ├── PRODUCT_GRID_2X2
                            ├── DYNAMIC_COLLECTION
                            ├── FLASH_SALE
                            ├── SPACER
                            └── DIVIDER
```

The client is intentionally a rendering engine. It does not hard-code homepage layout order. The payload decides which sections appear, and the registry decides whether this app version knows how to render them.

## Data Flow

```text
MOCK_HOMEPAGE_PAYLOAD
  -> App provider setup
  -> HomeScreen registers overlays
  -> DynamicRenderer filters valid and visible sections
  -> ComponentRegistry resolves section.type
  -> Section component renders UI
  -> Component emits SDUIAction
  -> ActionDispatcher executes local behavior
```

## Component Registry

The registry avoids brittle `switch` blocks in the renderer.

```ts
const COMPONENT_REGISTRY = {
  BANNER_HERO: BannerHeroComponent,
  PRODUCT_GRID_2X2: ProductGrid2x2Component,
  DYNAMIC_COLLECTION: DynamicCollectionComponent,
  HEADER_BANNER: HeaderBannerComponent,
  CATEGORY_GRID: CategoryGridComponent,
  FLASH_SALE: FlashSaleComponent,
  SPACER: SpacerComponent,
  DIVIDER: DividerComponent,
};
```

If the backend sends a future type such as `NEW_COMPONENT_V2`, `resolveComponent()` returns `undefined`, logs a warning, and `DynamicRenderer` returns `null` for that section. The rest of the feed remains stable.

## Runtime Theme Engine

The payload provides a theme object:

```ts
theme: {
  primary: '#FF6B6B',
  background: '#FFF9F5',
  surface: '#FFFFFF',
  textPrimary: '#1A1A2E'
}
```

`ThemeProvider` exposes the current theme through React Context. Components sample the theme for backgrounds, badges, text, borders, CTA buttons, and campaign state.

When a campaign is activated, `CampaignEngine` calls `replaceTheme(campaign.theme)`, so the whole app visually changes without a reload or binary update.

## Campaigns

Three assignment campaigns are implemented in the payload:

| Campaign | Theme | Overlay | Dedicated Row |
| --- | --- | --- | --- |
| Back To School | Bright yellow + primary blue | Paper-airplane/pencil style native Lottie | Lunchboxes, bags, school bottles |
| Summer Playhouse | Ocean blue palette | Water/beach themed native Lottie | Petting zoo tickets and outdoor fun |
| Mystery Gift Carnival | Carnival red palette | Confetti native Lottie | Mystery gift products and coupon action |

The development build shows `CampaignSwitcher` near the top of the homepage. Tap a campaign chip to verify:

- theme changes instantly,
- campaign banner appears,
- campaign-specific row becomes visible,
- overlay renders above the app,
- underlying buttons remain clickable.

## Overlay Engine

Overlays are registered from campaign payloads and shown by ID.

Important behavior:

- full-screen absolute layer,
- `pointerEvents="none"` so touches pass through,
- native uses `lottie-react-native` with cached composition,
- web uses a decorative fallback layer to keep browser verification stable.

This satisfies the assignment requirement that campaign animation layers must not occlude normal app interaction.

## Universal Action Dispatcher

Section components do not own business behavior. They emit declarative actions:

```ts
{
  type: 'ADD_TO_CART',
  payload: {
    id: 'prod-pampers-nb',
    name: 'Pampers New Baby Diapers',
    price: 599,
    imageUrl: 'https://...'
  }
}
```

`ActionDispatcher` handles:

- `ADD_TO_CART`
- `REMOVE_FROM_CART`
- `DEEP_LINK`
- `APPLY_MYSTERY_GIFT_COUPON`
- `SWITCH_CAMPAIGN`
- `OPEN_OVERLAY`
- `CLOSE_OVERLAY`
- `TRACK_EVENT`

This keeps components dumb and makes business logic centralized.

## Cart State and Render Isolation

Cart state lives in Zustand:

```ts
const quantity = useCartStore(cartItemQuantitySelector(product.id));
```

Each `ProductCard` subscribes only to its own product quantity. `CartBadge` subscribes only to total count. Adding one product updates:

- the clicked product card,
- the cart badge.

It does not force the full homepage, banners, collections, or unrelated cards to rerender.

## Performance Notes

- Outer homepage feed uses one vertical `FlashList`.
- Dynamic product rows use nested horizontal `FlashList`.
- Stable `keyExtractor` uses backend section IDs and product IDs.
- `getItemType` lets FlashList recycle matching section types safely.
- Section components and product cards use `React.memo`.
- Action handlers use stable callbacks.
- Each section is wrapped in an `ErrorBoundary`.

## Folder Structure

```text
sdui-kids-app/
├── App.tsx
├── app/index.tsx
├── app.json
├── babel.config.js
├── package.json
├── tsconfig.json
└── src/
    ├── components/
    │   ├── common/
    │   │   ├── CampaignSwitcher.tsx
    │   │   ├── CartBadge.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   └── ProductCard.tsx
    │   ├── registry/
    │   │   ├── ComponentRegistry.ts
    │   │   └── DynamicRenderer.tsx
    │   └── sections/
    │       ├── BannerHero.tsx
    │       ├── CategoryGrid.tsx
    │       ├── Divider.tsx
    │       ├── DynamicCollection.tsx
    │       ├── FlashSale.tsx
    │       ├── HeaderBanner.tsx
    │       ├── ProductGrid2x2.tsx
    │       └── Spacer.tsx
    ├── engine/
    │   ├── action/ActionDispatcher.tsx
    │   ├── campaign/CampaignEngine.tsx
    │   ├── campaign/CampaignDefinitions.ts
    │   ├── overlay/OverlayEngine.tsx
    │   └── theme/ThemeEngine.tsx
    ├── hooks/useSdui.ts
    ├── mocks/homePagePayload.ts
    ├── screens/HomeScreen.tsx
    ├── store/CartStore.ts
    ├── types/sdui.types.ts
    └── utils/helpers.ts
```

## Adding a New Section Type

1. Add a TypeScript interface in `src/types/sdui.types.ts`.
2. Add it to the `SDUISection` union.
3. Create a component in `src/components/sections`.
4. Register it in `src/components/registry/ComponentRegistry.ts`.
5. Add backend/mock payload nodes using the new `type`.

No renderer changes are required.

## Known Notes

- `expo-router` remains installed as a dependency from the original scaffold, but the app entry uses the normal Expo `App.tsx` path.
- Lint currently exits successfully with warnings about type-only imports and explicit return types. TypeScript strict checking passes.
- Expo prints compatibility warnings for a few package patch versions. The app still runs and verifies successfully.

# Kiddo_App
