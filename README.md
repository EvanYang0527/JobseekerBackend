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

### `POST /api/ragflow/woop`
Builds a WOOP (Wish, Outcome, Obstacle, Plan) prompt from the provided learner profile and forwards it to the configured RAGFlow
endpoint. The request body must include:

- `personalInfo` – Required. A string, array, or object describing the learner (for example name, role, or background details).
- `currentSkill` – Required. The learner's current skill or proficiency description.
- `goals` – Required. Target outcomes for the learner. Provide a string or an array of goal statements.
- `timeframe` – Optional. One of `24h`, `4w`, `3-12m`, or `none`. Defaults to `none` when omitted.
- `resources` – Optional. Array of learning resources retrieved from your vector database. Each entry can include `title`,
  `url`, `summary`, and other descriptive metadata. These are referenced in the generated plan.
- `ragflow` – Optional. Object used to control how the prompt is merged into the outgoing RAGFlow payload. Supply `payload`
  to start from a predefined payload, `promptField` to inject the prompt into a nested property (dot notation), or set
  `appendAsMessage` to `true` to append the prompt to an existing `messages` array. When omitted the service sends `{ "query":
  "<prompt>" }`.

The endpoint returns the raw response from RAGFlow, which should contain the generated WOOP report.

### `GET /api/ragflow/datasets`
Retrieves dataset information from RAGFlow. This endpoint requires the `RAGFLOW_DATASETS_PATH` environment variable.

### `GET /health`
Simple health check endpoint that returns `{ "status": "ok" }` when the service is running.

## Frontend integration

Configure the frontend to point to the backend base URL (for example `http://localhost:3001`). From the frontend you can:

- Submit questions or payloads to `/api/ragflow/query` to execute RAGFlow pipelines.
- Fetch dataset metadata from `/api/ragflow/datasets` to power selection widgets.

The backend handles CORS restrictions and proxies calls to the RAGFlow service, keeping API keys and internal URLs on the server side.
