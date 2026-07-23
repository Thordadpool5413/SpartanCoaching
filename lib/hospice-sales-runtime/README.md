# Hospice Sales Runtime

Private consolidated runtime for the eight AI tools used by the continuous sales workflow and the framework-neutral workflow orchestrator.

Import only the subpath needed by the host application:

```ts
import { run } from "@thordadpool5413/hospice-sales-runtime/pre-call-planner";
import { SalesWorkflowOrchestrator } from "@thordadpool5413/hospice-sales-runtime/sales-workflow";
```

Set `OPENAI_API_KEY` on the server and optionally set `OPENAI_MODEL` (the implementation-time default is `gpt-5.6-sol`). Do not expose the key to browser code.

Publishing uses GitHub Packages and requires `NODE_AUTH_TOKEN` in the environment. No token belongs in `.npmrc` committed to source.
