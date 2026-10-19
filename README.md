# BSO Jobs

The Bay Street Oracle's curated Canadian capital-markets job board.

## Local development

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deployment

This is a Next.js application configured for Vercel. Import this repository into
Vercel and use the detected defaults:

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: Next.js default

Future pushes to `main` automatically create new deployments after the GitHub
repository is connected in Vercel.

## Email delivery

Transactional email is delivered through Brevo. Configure these secrets in
GitHub Actions, and in Vercel for employer-request notifications:

- `BREVO_API_KEY`
- `BREVO_FROM_EMAIL` (for example, `Bay Street Oracle <jobs@baystreetoracle.ca>`)

The sender address and its domain must be verified in Brevo. Existing job-alert
workflows support dry runs, immediate delivery, previews, scheduling up to 72
hours ahead, and cancellation by the deterministic Brevo batch identifier.
