# Troubleshooting and collaboration

[Back to portfolio](../docs/portfolio.md)

My support approach is to make the problem understandable, identify the layer that needs attention, and verify the result from the user's point of view. I practice this in personal projects while bringing customer communication and team coordination experience from retail management.

## Examples in this portfolio

| Project | Evidence available | Support skill illustrated |
| --- | --- | --- |
| [Local Home AI](../projects/local-home-ai.md) | Historical audit: Ollama reachable, n8n web interface unreachable, n8n container exited | Narrow an investigation using service state and diagnostic output |
| [Pulse Feed](../projects/pulse-feed.md) | Browser review: category filter, unmatched search, recovery controls, and keyword-rule screen | Reproduce a user-visible issue and check filters before assuming a service failure |
| [PokéRaider Card Price Tracker](https://github.com/raiderfan5327-art/pokeraider-promo-dashboard/blob/main/docs/search-support-guide.md) | Public code and a clearly labeled practice support scenario | Explain search limits and collect information for escalation |
| [Rei](../projects/rei.md) | Owner-reported working Android build and setup/connection experience | Coordinate troubleshooting across a client and local PC services |

## A repeatable investigation

1. **Define the expected result.** Ask what the person was trying to do and what happened instead.
2. **Capture the context.** Record the application/build, device, time, exact message, and steps to reproduce.
3. **Locate the boundary.** Check whether the failure is in the interface, connection, service, response, or output.
4. **Test a specific explanation.** Use a small, reversible check. Record the result before changing another variable.
5. **Close with evidence.** Confirm the original task works, or hand off the remaining issue with a clear summary.

## Working with AI assistance

My projects use AI to help develop implementations, explain errors, and organize possible checks. I supply goals and context and work through the resulting setup and troubleshooting process.

AI suggestions are hypotheses until supported by a source or an observed result. In the local-AI audit, an unreachable n8n page and an exited container support investigating that container; they do not prove why it stopped. In Pulse Feed, working search controls do not prove background notifications work.

## Example escalation note

The following is a writing exercise based on the historical local-AI audit, not a support ticket submitted to an employer or vendor.

> **Issue:** The local automation web interface cannot be reached.  
> **Environment:** Personal Windows home lab using Docker and Ollama.  
> **Observed:** Ollama's local API responded. Docker engine information returned. The n8n web check could not connect, and the container listing showed n8n exited.  
> **Scope:** These observations are from a saved August 2, 2026 audit; current status needs rechecking.  
> **Changes made by the audit:** None; it was read-only.  
> **Next investigation:** Review container logs and startup configuration, then verify the interface and a test workflow after any corrective action.  
> **Resolution status:** No successful n8n repair is established by this record.

## What “complete” means

A process appearing in a list is not the same as a successful user task. For Rei, completion requires a response in the Android app. For the notes workflow, it requires a correctly written note. For a search problem, it means finding the expected item or producing enough evidence for someone else to continue the investigation.

The goal is a clear handoff and an honest status, with sensitive details removed from shared evidence.

Prepared with AI assistance; reviewed October 9, 2026.
