# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deployment

1. Create an environment file:

   Create `.env` (or use your hosting provider's Secret Manager) with:

   ```
   GOOGLE_GENAI_API_KEY=your-key
   # Optional alternative env name supported:
   # GOOGLE_API_KEY=your-key
   ```

2. Build and start locally in production mode:

   ```bash
   npm run build && npm run start
   ```

3. Health check endpoint:

   `GET /api/health` returns `{ "status": "ok" }` for uptime probes.

Notes:
- The Next.js build is configured for `output: 'standalone'` for easier deployment.
- TypeScript and ESLint errors fail the production build by default.