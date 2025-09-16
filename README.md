# Jobseeker Backend

Node.js backend service for the Jobseeker platform. The service exposes a lightweight API layer that the frontend can use to interact with a RAGFlow deployment.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and update the values for your environment:
   ```bash
   cp .env.example .env
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

   The server starts on the port defined in the `.env` file (defaults to `3001`).

## Configuration

| Variable | Description |
| --- | --- |
| `PORT` | Port used by the backend server. |
| `CORS_ALLOWED_ORIGINS` | Comma separated list of frontend origins allowed to call the API. Leave empty to allow any origin. |
| `RAGFLOW_BASE_URL` | Base URL of your RAGFlow instance. |
| `RAGFLOW_API_KEY` | Optional bearer token used when RAGFlow requires authentication. |
| `RAGFLOW_QUERY_PATH` | Path executed when the frontend posts a query to RAGFlow. |
| `RAGFLOW_DATASETS_PATH` | Optional path used to fetch dataset metadata from RAGFlow. |
| `RAGFLOW_TIMEOUT` | Optional timeout (ms) applied to requests sent to RAGFlow. |

## API

All endpoints are prefixed with `/api/ragflow`.

### `POST /api/ragflow/query`
Forwards the request body to the configured RAGFlow query endpoint. The response from RAGFlow is returned unchanged.

### `GET /api/ragflow/datasets`
Retrieves dataset information from RAGFlow. This endpoint requires the `RAGFLOW_DATASETS_PATH` environment variable.

### `GET /health`
Simple health check endpoint that returns `{ "status": "ok" }` when the service is running.

## Frontend integration

Configure the frontend to point to the backend base URL (for example `http://localhost:3001`). From the frontend you can:

- Submit questions or payloads to `/api/ragflow/query` to execute RAGFlow pipelines.
- Fetch dataset metadata from `/api/ragflow/datasets` to power selection widgets.

The backend handles CORS restrictions and proxies calls to the RAGFlow service, keeping API keys and internal URLs on the server side.
