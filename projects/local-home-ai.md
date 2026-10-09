# Local Home AI — Windows service troubleshooting and workflow design

[Back to portfolio](../docs/portfolio.md) · [Troubleshooting and collaboration](../docs/troubleshooting-and-collaboration.md) · [Related Android project: Rei](rei.md)

**Project type:** Personal home lab  
**Tools represented in the records:** Windows, PowerShell, Ollama, Docker Desktop, WSL, n8n, and Obsidian  
**Evidence:** A saved read-only audit dated August 2, 2026, plus an AI-assisted workflow artifact

## Goal and my role

I worked with an AI assistant to set up and troubleshoot a local AI environment on my home PC. The goal was to run local models and explore a workflow that could summarize material into organized notes.

My contribution included providing the environment and diagnostic output, communicating what I wanted the tools to do, and coordinating the next troubleshooting steps with AI assistance. The saved records support an environment review and a workflow design; they do not establish that every proposed automation ran successfully.

## Environment recorded in the audit

| Component | Recorded state on August 2 |
| --- | --- |
| Operating system | Windows 11 Home, 64-bit |
| Hardware | Ryzen 5 5600X, NVIDIA RTX 3060, approximately 16 GB RAM |
| Local model service | Ollama process present; local API reachable |
| Local model inventory | Included qwen3:8b, hermes3:8b, and deepseek-r1:8b |
| Container platform | Docker client and engine information returned |
| Automation service | n8n container listed as exited; local n8n web test could not connect |
| Notes | Obsidian vault locations were detected |

This is a historical snapshot. Software versions, service availability, and configuration may have changed since the audit.

## Troubleshooting case: one reachable service, one unavailable service

**Problem to investigate:** The local AI environment had several components, but the automation web interface was not reachable.

**Evidence collected:** The read-only audit checked installed software, processes, services, listening ports, local API responses, container state, startup entries, and note locations.

| Observation | Interpretation supported by the record | What it does not prove |
| --- | --- | --- |
| Ollama's local API responded and returned a model list | The local model service was reachable from the PC during the audit | That every model could generate a response or that another device could connect |
| The n8n web test failed and its container was exited | The stopped automation container was a concrete starting point for investigation | Why it stopped, or that restarting alone would resolve every issue |
| Docker engine information returned | The engine was responding when that command ran | That all containers or their mounted folders were healthy |
| Ollama listened on loopback | Local-host access was available; remote-device access still required separate checking | A successful Android-to-PC connection |
| A privilege-sensitive security check returned access denied | The non-administrator audit could not establish that setting | That the protection was disabled |

The next diagnostic step would be to inspect the stopped container's logs and configuration, then confirm that the web interface responds after any authorized change. This case study does not claim an unrecorded repair or a verified restart.

**Recorded outcome:** The audit separated a reachable model service from an unavailable automation service and supplied evidence for a narrower next investigation. The audit itself changed no settings.

## Workflow artifact: material to Markdown notes

The saved n8n workflow defines five stages:

| Stage | Behavior in the artifact |
| --- | --- |
| Collect input | A form accepts a title, category, optional source URL, and material |
| Prepare a prompt | Normalizes fields, rejects empty material, and requests a structured summary |
| Call local Ollama | Sends the prompt to qwen3:8b through the configured Docker-to-host endpoint |
| Build the note | Checks for an empty model response and combines the summary, source link, metadata, and original material |
| Write the file | Writes a Markdown note to a configured mounted folder intended for Obsidian |

The artifact includes filename cleanup and instructions to label uncertainty and avoid inventing facts. Those are design choices, not guarantees of model accuracy.

**Workflow status:** The saved export is marked inactive. Its source describes the intended integration, but this portfolio review did not run it or verify the final note output. Establishing a working pipeline would require checking the model request, mounted-folder permissions, and the resulting note together.

## Coordination and lessons

This project required reasoning across service boundaries: the Windows host, a container, a model API, and a notes folder. Collecting one shared diagnostic record made it easier to distinguish observations from assumptions when discussing next steps with an AI assistant.

It also reinforced that “installed,” “running,” “reachable,” and “works from the client” are different states. That distinction is useful when supporting applications with several dependencies.

## Evidence and privacy

This write-up is a sanitized summary of the original audit and workflow. Computer names, account paths, network addresses, raw startup records, and personal notes are omitted. The original records remain private.

Prepared with AI assistance; reviewed October 9, 2026.
