# Deploying MetaPrompt Studio to Render

This file contains minimal steps to deploy the backend (Flask) and frontend (Vite) to Render.

Backend (Flask)

- Create a new **Web Service** on Render and connect your repository.
- Set the build command: `pip install -r backend/requirements.txt`
- Set the start command (Render will use `Procfile`): `gunicorn "app:app" --bind 0.0.0.0:$PORT`
- Set environment variables in Render: `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY` (optional), `FRONTEND_URL` (your frontend URL).
- Choose Python 3.11+ (or your desired version) in service settings.

Frontend (Vite)

- Option 1 (Render Static Site): Create a **Static Site** on Render.
  - Build command: `cd frontend && npm ci && npm run build`
  - Publish directory: `frontend/dist`
  - Set `VITE_API_URL` environment variable to your backend service URL (for example, `https://your-backend.onrender.com`).

- Option 2 (Vercel): Connect the `frontend` folder to Vercel. Set `Build Command` to `npm ci && npm run build` and `Output Directory` to `dist`. Set `VITE_API_URL` in Vercel environment variables.

Notes

- For local development, keep `DATABASE_URL` unset to use the default SQLite file. In production, always set `DATABASE_URL` to Postgres.
- Consider adding Flask-Migrate for database migrations instead of relying on `db.create_all()`.
- Ensure `JWT_SECRET` is a strong secret and not committed to source control.
