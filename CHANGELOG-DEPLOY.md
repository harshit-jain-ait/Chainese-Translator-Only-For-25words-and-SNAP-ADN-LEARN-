# Changelog: Deployment Architecture Setup (Vercel Frontend + Render Docker Backend)

## Overview
This update decouples the frontend and backend architectures:
1. **Frontend**: Static React + Vite Single Page Application configured for native hosting on Vercel.
2. **Backend**: FastAPI + OWLv2 machine learning inference service containerized with Docker for deployment on Render (or Railway) with CPU-optimized PyTorch.

---

## Changes by Component

### 1. Backend Dependency Isolation (`backend/requirements.txt` & `Dockerfile`)
- Removed all index flags (`--index-url`, `--extra-index-url`) from `backend/requirements.txt` to eliminate dependency resolution confusion in standard pip/uv tools.
- Pinned all dependencies to exact versions:
  - `fastapi==0.115.0`
  - `uvicorn[standard]==0.30.6`
  - `python-multipart==0.0.12`
  - `transformers==4.45.1`
  - `pillow==10.4.0`
  - `opencv-python-headless==4.10.0.84`
  - `edge-tts==7.3.1`
  - `httpx==0.27.2`
  - `numpy==1.26.4`
  - `certifi==2024.8.30` (satisfies `edge-tts>=7.3.1`)
  - `scipy==1.14.1`
- Excluded `torch` from `requirements.txt`. CPU-optimized PyTorch is installed directly in the Dockerfile via `--index-url https://download.pytorch.org/whl/cpu`.
- Created `backend/requirements-dev.txt` containing test dependencies (`pytest==8.3.3`).
- Pinned `backend/.python-version` to `3.11`.

### 2. Backend Containerization (`backend/Dockerfile` & `.dockerignore`)
- Created `backend/Dockerfile` using `python:3.11-slim`:
  - Installs CPU-only PyTorch and Torchvision.
  - Installs application requirements.
  - Creates and drops privileges to non-root `appuser` (UID 1000).
  - Configures writable model cache directory `HF_HOME=/app/.cache/huggingface`.
  - Exposes port 8000 and starts Uvicorn with dynamic `$PORT` support.
- Created `backend/.dockerignore` to exclude local caches, virtual environments, tests, and sensitive files.

### 3. Backend Configuration (`backend/main.py`)
- Configured dynamic CORS using the `CORS_ORIGINS` environment variable (comma-separated), defaulting to `http://localhost:5173` and `http://127.0.0.1:5173` when unset.
- Enhanced `/api/health` response with `"model_status"` reporting (`"ready"` or `"loading"`).
- Ensured all paths are resolved relative to the file using `pathlib.Path`.
- Bound container server port to `$PORT` environment variable when specified.
- Added unit tests in `backend/tests/test_cors.py` verifying CORS origin parsing.

### 4. Frontend Dynamic API Base (`frontend/src/api/client.ts` & `src/speech.ts`)
- Added `getApiUrl(path: string)` helper in `frontend/src/api/client.ts` that prepends `import.meta.env.VITE_API_BASE` (stripping trailing slashes) and falls back to relative `/api/...` paths when empty or unset.
- Integrated `getApiUrl` across all API and audio calls:
  - `getHealth()`
  - `getVocab()`
  - `detectObjects()`
  - `buildSpeakUrl()` in `src/speech.ts`
  - `Navbar.tsx` health status polling
- Created `frontend/src/vite-env.d.ts` declaring types for `VITE_API_BASE`.
- Added `frontend/.env.example` documenting the environment variable.
- Added unit tests in `frontend/src/test/apiClient.test.ts` verifying URL resolution.

### 5. Vercel Configuration (`vercel.json` & `.vercelignore`)
- Replaced multi-service configuration in `vercel.json` with a single-tier frontend build specification:
  - `"buildCommand": "cd frontend && npm ci && npm run build"`
  - `"outputDirectory": "frontend/dist"`
  - `"installCommand": "cd frontend && npm ci"`
  - SPA routing rewrite: `[{"source": "/(.*)", "destination": "/index.html"}]`
- Created `.vercelignore` ignoring `backend/`, `eval/`, and `images/` so Vercel never attempts to execute Python builds or deploy serverless functions.
- Removed legacy `uv.toml` configuration files.

---

## Test Results
- **Backend Tests**: 35 passed (`pytest backend/tests`).
- **Frontend Tests**: 45 passed (`vitest run`).
- **Frontend Build**: `tsc && vite build` completed with 0 errors.

