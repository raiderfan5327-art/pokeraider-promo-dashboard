# PokéRaider Pokémon Card Price Tracker

A mobile-first installable PWA for tracking Pokémon card prices across the full English catalog, including promos and regular sets.

## What is connected

- Supabase project: `pokeraider-os`
- Private user watchlists and price history
- Protected JustTCG pricing functions
- Pokémon TCG API artwork matching and image cache
- Email/password authentication and row-level security
- Hourly price refreshes and threshold alerts

## Live site

`https://raiderfan5327-art.github.io/pokeraider-promo-dashboard/`

## Main features

- Full-catalog Pokémon card search
- Variant-specific condition and printing selection
- Card images with larger-image links
- Current price and 24-hour movement
- Stored historical price charts
- Automatic hourly refreshes
- Movement and high/low target alerts
- Installable Android PWA

## Provider limits

The current JustTCG plan accepts up to 20 cards per search or batch request. Broad searches display the best 20 matches; refine by card name, set, or number for additional results.

The private JustTCG key belongs only in Supabase Edge Function secrets under `JUSTTCG_API_KEY`. Never place it in browser-visible files.
