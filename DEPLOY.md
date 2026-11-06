# Deployment Guide: Chinese Object Vocabulary Detector

This project is architected for dual-cloud deployment:
- **Frontend (SPA)**: Deployed to **Vercel** as a static Vite React application.
- **Backend (API & ML Model)**: Deployed to **Render** (or Railway) as a containerized Docker service with CPU-optimized PyTorch.

---

## 1. Deploying the Backend on Render

Render hosts the FastAPI application and the zero-shot OWLv2 object detector model inside a Docker container.

### Steps:
1. Log in to [Render](https://dashboard.render.com/) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository: `https://github.com/harshit-jain-ait/Chainese-Translator-Only-For-25words-and-SNAP-ADN-LEARN-.git`.
3. Configure service settings:
   - **Name**: `chinese-detector-backend`
   - **Region**: Choose a region near your users (e.g. `Oregon (US West)` or `Frankfurt (EU)`).
   - **Root Directory**: `backend`
   - **Environment**: **Docker** (Render will automatically detect `backend/Dockerfile`).
   - **Instance Type / Plan**: Choose a plan with at least **2 GB RAM** (e.g. Starter or Standard) to accommodate the OWLv2 model weights and image inference.
4. Configure **Environment Variables**:
   - `CORS_ORIGINS`: Set to your Vercel frontend URL, e.g. `https://your-app.vercel.app` (comma-separated if multiple domains).
   - `PORT`: `8000` (Render also injects `$PORT` automatically).
5. Set Health Check:
   - **Health Check Path**: `/api/health`
6. Click **Create Web Service**.
   - Note: The initial build will take 3–5 minutes as Render builds the container and downloads PyTorch CPU wheels.
   - Once deployed, copy your backend service URL (e.g., `https://chinese-detector-backend.onrender.com`).

---

## 2. Deploying the Frontend on Vercel

Vercel builds and hosts the React + Vite frontend directly from the repository.

### Steps:
1. Log in to [Vercel](https://vercel.com/) and click **Add New...** $\rightarrow$ **Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: Click "Edit" and select **`frontend`** (Recommended — isolates the frontend and prevents Vercel from inspecting the backend directory). If left as `./`, the root `vercel.json` and `.vercelignore` will route the build to `frontend`.
4. Configure **Environment Variables**:
   - **Name**: `VITE_API_BASE`
   - **Value**: Your Render backend URL, e.g. `https://chinese-detector-backend.onrender.com` (no trailing slash).
5. Click **Deploy**.
   - Vercel installs frontend dependencies and generates static assets into `dist`.
   - The SPA rewrite in `vercel.json` routes all client-side navigation to `/index.html`.

---

## 3. Post-Deployment Linking

1. Once both services are deployed, ensure your frontend URL (e.g., `https://your-app.vercel.app`) is included in Render's `CORS_ORIGINS` environment variable.
2. If you deployed Vercel before Render, update `VITE_API_BASE` in Vercel **Settings** $\rightarrow$ **Environment Variables**, then trigger a **Redeploy** so Vite injects the backend URL into the production bundle.

---

## 4. Troubleshooting & Notes

- **CORS Error in Browser**:
  - If the browser blocks requests to `/api/...`, verify that `CORS_ORIGINS` on Render contains your exact Vercel frontend domain including protocol (e.g. `https://your-app.vercel.app` without a trailing slash).
- **HTTP 503 on `/api/detect`**:
  - The OWLv2 model downloads and initializes on container startup in the background lifespan handler. During the first ~60 seconds after boot, `/api/health` reports `"model_status": "loading"`. Once loaded, it transitions to `"ready"`.
- **First Boot Delay**:
  - The first time the container starts, Hugging Face downloads the OWLv2 model weights into `/app/.cache/huggingface`. Subsequent requests will be fast.
- **Camera Access (HTTPS)**:
  - Browser camera APIs require a secure context (`HTTPS` or `localhost`). Both Vercel and Render provide automated SSL/TLS certificates out of the box.

