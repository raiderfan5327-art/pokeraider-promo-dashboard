# Pulse Feed — personalized RSS application

[Back to portfolio](../docs/portfolio.md) · [Open the demo](https://pulsefeed.ai.studio/)

**Project type:** Personal, AI-assisted web application  
**Creation environment:** Google AI Studio  
**Portfolio review:** October 9, 2026

## Purpose and my role

I created Pulse Feed to bring news from several interests into one place and make relevant stories easier to find. My role was defining the application I wanted and using Google AI Studio to build it with AI assistance.

The published interface describes the project as an RSS feed updater and notification hub. This walkthrough documents what was visible and what was checked during the portfolio review; it does not attribute every implementation detail to independent coding.

## What the public interface contains

- An article stream with topic categories and title/keyword search.
- Priority matches, unread and saved views, sorting, and quick-read controls.
- A keyword-rule screen with category scope, high/medium/mute priorities, and notification controls.
- Feed-source management and controls for discovering or adding feeds.
- AI briefing, feed Q&A, and article-takeaway entry points.
- Refresh status and an install-to-home-screen control.

The presence of a control is distinct from testing its complete service behind it.

## Browser checks

These checks were performed with an AI assistant during portfolio preparation.

| Check | Observed result |
| --- | --- |
| Open the supplied public address | Pulse Feed loaded without a sign-in wall |
| Select the NFL category | The stream count changed from 243 total items to 75 NFL items in that session |
| Search for a deliberately unmatched phrase | The interface showed 0 matches, an explanation, and controls to reset filters or fetch news |
| Reset filters | The search was cleared and the broader feed view returned |
| Open Keyword Rules | Existing rules and the controls for keyword, category, priority, and notifications were visible |

Counts describe that review session, not fixed product capacity or user metrics.

## Support example: “A story disappeared”

A missing story can have several explanations. Start with the selected category, search phrase, and view before assuming a feed has failed. Pulse Feed's empty-search state offers a useful recovery path: adjust the query or reset filters.

For a reproducible report, record the expected article, selected source, category, search text, time, and observed message. Test whether clearing the filters changes the result. A cleared filter does not establish whether every upstream RSS source is healthy.

## Validation scope

The public page and the interactions in the table were checked. AI output generation, background push delivery, feed import, cross-device persistence, mobile installation, and upstream article accuracy were not tested. Displayed headlines are application content, not independently verified reporting. No claim is made that all displayed items were fetched live.

Source code and a build export were not available in this repository for this review. The public demo is the primary visual evidence.

## What this project adds to my portfolio

Pulse Feed shows how I translate a personal information need into an application and think through the experience of a user who cannot find an expected result. The review also demonstrates a useful support habit: record an observed behavior before claiming that a larger feature works.

Prepared with AI assistance.
