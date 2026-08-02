# GiGO Deployment

## Backend: Render

Deploy `gigo-backend` as a Render web service. The included root `render.yaml`
uses the backend Dockerfile and exposes the API on Render's `$PORT`.

Required Render environment variables:

- `FRONTEND_DOMAIN`: your Vercel production URL.
- `GEMINI_API_KEY`: Gemini API key used by backend agents.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: full Firebase service account JSON for Firestore.

Instead of `FIREBASE_SERVICE_ACCOUNT_JSON`, you can set:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

The backend health check is:

```text
GET https://your-render-service.onrender.com/
```

It should return `{"status":"online", ...}`.

## Frontend: Vercel

Deploy the `gigo` folder as the Vercel project root.

Required Vercel environment variables:

- `VITE_API_BASE_URL`: your Render backend URL, for example `https://your-render-service.onrender.com`.
- `VITE_FRONTEND_DOMAIN`: your Vercel production URL.

The frontend does not talk to Firestore directly. It calls the Render backend,
and the backend reads/writes Firestore through Firebase Admin.

## Data Flow

```text
Browser on Vercel -> Render API -> Firestore
```

After both deploys, verify from the browser devtools Network tab that API calls
go to the Render domain, not `localhost:8080` or `gigo-backend.example.com`.
