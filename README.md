# Spartan Coaching

Hospice sales coaching website and calculator suite built with React, Vite, Express, and PostgreSQL.

## Run locally

```bash
npm ci
npm run dev
```

## Verify and build

```bash
npm run check
npm test
npm run build
NODE_ENV=production npm start
```

After setting `DATABASE_URL` for the first time, apply the schema (including the shared AI quota table):

```bash
npm run db:push
```

## Required production configuration

- `DATABASE_URL` - PostgreSQL connection string.
- `OPENAI_API_KEY` - required for AI-powered tools.
- `RESEND_API_KEY` - required for outbound notifications and report email.
- `ADMIN_PASSWORD` - required for the existing admin controls.
- `SITE_URL` - public site URL used in outbound links.
- `BUILD_VERSION` - deployment identifier used to invalidate stale HTML.

## Object storage

Set `OBJECT_STORAGE_BACKEND=replit` when using Replit object storage. All other deployments use the local filesystem fallback at `data/object-storage` by default. Set `LOCAL_OBJECT_STORAGE_DIR` to use a persistent mounted volume.
