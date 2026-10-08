# PokéRaider Pokémon Card Price Tracker

A personal, AI-assisted web application for searching Pokémon cards and following prices for specific card variants.

[Ryan Steele — portfolio](docs/portfolio.md) · [Support writing sample](docs/search-support-guide.md) · [Application link](https://raiderfan5327-art.github.io/pokeraider-promo-dashboard/)

## The problem

Collectors need to distinguish a card’s set, printing, and condition when comparing prices. This project brings card search, a selected watchlist, historical prices, and alert settings into a mobile-oriented interface.

## Features in the source

- Email/password sign-in and account creation through Supabase.
- Card search with set, number, rarity, condition, and printing details.
- Watchlist entries tied to a selected card variant.
- Current prices, 24-hour movement, and historical charts.
- Settings for percentage-movement and high/low price alerts.
- In-app alert display and a mark-as-read action.
- Web app manifest and service worker for a PWA experience.

## Support-focused examples

| User situation | Behavior visible in the code | Source |
| --- | --- | --- |
| A broad search has more matches than it returns | Displays the returned and total counts and suggests a more specific name, set, or number | `catalog.js` → `searchCatalog` |
| The same variant is added again | Handles database error `23505` with an explanation that the variant is already on the watchlist | `catalog.js` → `addCard` |
| An alert threshold is outside the accepted range | Rejects invalid input and gives a specific message | `alerts.js` → `saveSettings` |
| The pricing function reports an error | Displays the returned error or a fallback service message | `catalog.js` → `providerCall` |
| A watchlist needs a manual refresh | Splits the work into groups of up to 20 entries | `app.js` → `refreshPrices` |

Validation details are recorded below.

## How the application is organized

| File | Responsibility |
| --- | --- |
| `index.html`, `styles.css` | Page structure and presentation |
| `app.js` | Authentication, dashboard, watchlist, charts, and manual price refresh |
| `catalog.js` | Full-catalog search and adding card variants |
| `alerts.js`, `alerts.css` | Alert settings, displayed alerts, and read status |
| `images.js` | Card-artwork behavior, as documented in the original README |
| `config.js` | Client configuration |
| `manifest.webmanifest`, `sw.js` | PWA metadata and service-worker caching |

The client calls a configured Supabase function for pricing and accesses watchlist, price-history, and alert tables. The original project documentation identifies JustTCG as the pricing provider and Pokémon TCG API as an artwork source.

## Running the frontend locally

Clone or download this repository. With Python 3 installed, run the following command from the repository folder:

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

This serves the frontend only. Functional sign-in, card search, saved watchlists, and alerts depend on a configured backend and provider access. The reviewed repository root does not include a complete backend setup guide; a fresh clone is not yet a self-contained reproduction of the whole service.

Keep private provider credentials in server-side configuration. The original README identifies `JUSTTCG_API_KEY` as an Edge Function secret, not a value to place in browser files.

## Validation status and limits

A portfolio source review on October 8, 2026 checked the frontend paths described above. Live authentication, provider responses, scheduled refreshes, alert generation, and installation on an Android device were not tested during that review.

The original README describes hourly refreshes and row-level security; their deployed configuration was not inspected. Treat those as documented backend behavior pending verification.

Search requests ask for up to 20 cards, and the catalog renderer displays up to five variants per returned card. Refine searches when the desired card is absent from the returned subset. These are implementation observations, not a guarantee of the provider’s current plan terms.

## Development approach

Ryan Steele owns this personal project and uses AI-assisted development. It supports ongoing learning about application behavior, service dependencies, and troubleshooting.
