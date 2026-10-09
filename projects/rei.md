# Rei — Android AI assistant with local PC services

[Back to portfolio](../docs/portfolio.md) · [Local Home AI](local-home-ai.md) · [Troubleshooting and collaboration](../docs/troubleshooting-and-collaboration.md)

**Project type:** Personal, AI-assisted Android application  
**Tools used in the project:** Android Studio, Ollama, and local PC services  
**Reported milestone:** Working v0.5 build

## Purpose and my role

I developed Rei with AI assistance to access a personal AI assistant from my Android phone while using local PC services. I worked through application setup and connection troubleshooting and reported the v0.5 assistant working during development.

My role was directing the project, working through setup with guidance, communicating symptoms and results, and iterating toward a working experience. AI assisted with implementation and troubleshooting explanations.

## How the pieces fit together

The Android app is the client. Local PC services support the model interaction, with Ollama providing the local model runtime. This creates more than one place to investigate when a request fails: the app, the connection, the PC service, or the model.

This is a high-level project description. A reviewed Android source export is not included here, so the write-up does not assert a specific network library, API route, background-service design, or security architecture.

## Troubleshooting approach

Application setup and connection troubleshooting were part of the project. The original step-by-step Android development transcript was not available for this portfolio review. The checklist below is a support approach for this setup, not a reconstructed incident log or a claim that each listed fault occurred.

| Symptom | Question to isolate the problem | Useful evidence |
| --- | --- | --- |
| App cannot connect | Is the PC service running and reachable from the intended client? | App error, service status, device/network context |
| PC request works but phone request fails | Is the problem specific to the client-to-PC connection or its configuration? | Comparable requests from each device and their results |
| Connection succeeds but no answer appears | Did the model finish and did the app handle the returned response? | Sanitized response status, timing, and app output |
| Behavior changes after an edit | Which configuration or build changed since the last working attempt? | Build/version, the single change, and reproduction steps |

A useful check ends with the actual user task: send a message from the Android app and verify that a response appears there. A reachable PC endpoint alone is only a partial result.

## Coordination during development

The project involved iterative work with an AI assistant: communicating the desired behavior, following setup guidance, reporting what happened, and adjusting the next step. The practical learning was connecting the application experience to the services it depended on and describing a problem clearly enough to investigate it.

## Outcome and validation scope

I reported Rei working at v0.5 during development. This is an owner-reported milestone; the Android source, APK, device recording, and end-to-end phone/PC connection were not independently retested in the October 9 portfolio review.

This case study documents my personal learning experience. A public source export and a fresh device demonstration would provide additional evidence of the implementation.

Prepared with AI assistance.
