# PokéRaider Promo Price Tracker

A mobile-first installable PWA for tracking Pokémon promo card prices.

## What is connected

- Supabase project: `pokeraider-os`
- Secure tables: `promo_watchlist` and `promo_price_history`
- Protected Edge Function: `promo-price-proxy`
- Frontend configured with the project's public URL and publishable key
- Email/password authentication and row-level security

## Pricing key

The private JustTCG key belongs only in Supabase Edge Function secrets under:

`JUSTTCG_API_KEY`

Never put the private key in `config.js`, `app.js`, GitHub, or another browser-visible file.

## Live site

GitHub Pages deployment is enabled for:

`https://raiderfan5327-art.github.io/pokeraider-promo-dashboard/`

## MVP features

- Private account signup and sign-in
- Promo-only live card search
- Variant-specific watchlist
- Current price and 24-hour movement
- Stored historical price points
- 7-day, 30-day, 90-day, and one-year charts
- Batch refreshes capped at 20 cards per provider request
- Installable PWA shell and offline interface cache

## Data-provider note

The JustTCG personal plan has usage and licensing limits. Review its current terms before using this dashboard commercially or opening access to other users.

_Last deployment trigger: 2026-08-04_
