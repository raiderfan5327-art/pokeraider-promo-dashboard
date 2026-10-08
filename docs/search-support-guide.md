# Support guide: missing cards in search results

**Type:** Source-based support exercise  
**Application:** PokéRaider Pokémon Card Price Tracker  
**Scope:** Understanding search limits and collecting useful escalation evidence

## User report

“I searched for a Pokémon, but the card I wanted did not appear.”

This practice scenario is based on the application source.

## First response

“Please send the exact search term and the card’s set and number, if you have them. Also let me know whether you see no results, a limited-results message, or an error message.”

## Investigation

| Observation | Check | Next step |
| --- | --- | --- |
| The search term is one character | The form requires at least two characters | Use a longer card name or identifier |
| A message says only some matches are shown | The request uses `limit: 20` | Narrow the search using the name, set, or number |
| The card appears, but a desired variant is missing | The renderer takes the first five variants returned for each card | Record the missing condition/printing and escalate for response inspection |
| No cards are returned | Record the exact query and check for spelling or identifier ambiguity | Try one known card as a comparison; record both results |
| A service error appears | Preserve the exact message and time | Escalate with steps to reproduce; a message alone does not establish the cause |

## Evidence for escalation

Record the browser/device, time and timezone, exact query, expected card and variant, actual message, and reproducibility. Include a redacted screenshot when useful. If available, include a sanitized request status or error identifier; exclude authentication tokens and private account data.

## Example reply for a limited-results message

“The search returned only part of the matching catalog. Please try the card’s name with its set or number to narrow the results. If the card still does not appear, send me the exact search and expected card so we can investigate that specific match.”

## Completion criteria

The requested card is found, or the issue is handed off with enough information to reproduce it. Do not label a suspected provider or backend problem as resolved without checking the result.

## Source basis

- [`index.html`](https://github.com/raiderfan5327-art/pokeraider-promo-dashboard/blob/main/index.html): search field minimum length.
- [`catalog.js`](https://github.com/raiderfan5327-art/pokeraider-promo-dashboard/blob/main/catalog.js): `searchCatalog`, `renderResults`, and `providerCall`.

Prepared with AI assistance as a source-based writing sample.
