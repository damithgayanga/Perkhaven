# Perkhaven frontend

The frontend is a Next.js application configured for static export to AWS S3 and CloudFront.

## Local development

Requires Node.js 22 or later.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Verify the production artifact

```bash
npm run lint
npm run build
```

The production build is written to `out/`. GitHub Actions uploads that directory to the private frontend S3
bucket. CloudFront routes `/api/*` to the Spring Boot service, so production frontend requests remain
same-origin.

The prototype screens still need to be migrated from their original `/api/*` contracts and demo login to the
Spring Boot `/api/v1/*` API and Cognito authorization-code flow.
