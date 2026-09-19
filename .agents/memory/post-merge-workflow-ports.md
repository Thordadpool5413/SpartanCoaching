---
name: Post-merge workflow ports
description: How to handle artifact workflow restarts that fail because pre-merge servers still own configured ports.
---

When many managed artifact workflows fail together with `EADDRINUSE` immediately after task merges, check whether older artifact server processes still own the registered ports before changing workflow commands or app code.

**Why:** Workflow reconciliation can attempt to start replacements while stale pre-merge Vite, API, or Expo processes remain alive. The apps may still appear partially available, but Replit reports the tracked workflows as failed and later restarts create more duplicates.

**How to apply:** Map each configured artifact port to its process, stop only those registered port owners, then restart the existing managed workflows once. Do not create replacement workflows or broadly kill unrelated Node processes.