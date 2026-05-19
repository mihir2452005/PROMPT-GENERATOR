# Deploying frontend to Vercel

1. Create a new project in Vercel and connect the repository.
2. In the project settings, set `Build Command` to `npm ci && npm run build` and `Output Directory` to `dist`.
3. Add an environment variable `VITE_API_URL` pointing to your backend URL (e.g. `https://metaprompt-backend.onrender.com`).
4. Deploy; Vercel will provide the frontend URL to use as `FRONTEND_URL` in backend config.
