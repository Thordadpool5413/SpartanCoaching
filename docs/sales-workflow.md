# Sales Command Center

The connected hospice sales workflow is built directly into SpartanCoaching.

## Where to find it

- Website: sign in with an active Field Kit membership, open **Tools**, then choose **Sales Command Center**.
- Direct website route: `/tools/sales-workflow`
- Mobile app: sign in, open **Home**, then choose **Sales Command Center** under Quick Tools.
- API health: `/api/v1/sales-workflow/health`

The workflow joins the Pre-Call Planner, Discovery Coach, Objection Coach, Roleplay Scenario Coach, Adaptive Roleplay Response, Call Performance Coach, Coaching Feedback, and Email Optimizer.

## Replit setup

1. Pull the merged SpartanCoaching branch in Replit.
2. Run the repository post-merge workflow. It installs dependencies, updates the Drizzle schema, and applies the sales-workflow PostgreSQL migration and row-level-security policies.
3. Keep `OPENAI_API_KEY` and `OPENAI_MODEL` in Replit Secrets.
4. Add `SALES_WORKFLOW_ENCRYPTION_KEY` as a base64-encoded 32-byte value before accepting transcripts. Generate one outside source control with:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

5. Restart the API and web/mobile development processes.

Calls without transcripts remain usable if the encryption key has not been configured. Transcript submission returns a safe configuration error until encryption is enabled.

Google and Outlook buttons remain disabled at the API layer until their OAuth adapters and credentials are configured. CSV account import is available to organization administrators. Email output is draft-only, and any A/B comparison remains simulated.
