const dotenv = require('dotenv');

let cachedConfig;

function parseAllowedOrigins(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  dotenv.config();

  const port = Number.parseInt(process.env.PORT || '3001', 10);
  const timeout = Number.parseInt(process.env.RAGFLOW_TIMEOUT || '30000', 10);

  cachedConfig = {
    port: Number.isNaN(port) ? 3001 : port,
    cors: {
      allowedOrigins: parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
    },
    ragflow: {
      baseUrl: process.env.RAGFLOW_BASE_URL || '',
      apiKey: process.env.RAGFLOW_API_KEY || '',
      queryPath: process.env.RAGFLOW_QUERY_PATH || '',
      datasetsPath: process.env.RAGFLOW_DATASETS_PATH || '',
      timeout: Number.isNaN(timeout) ? 30000 : timeout,
    },
  };

  if (!cachedConfig.ragflow.baseUrl) {
    console.warn('RAGFLOW_BASE_URL is not configured. RAGFlow requests will fail until it is set.');
  }

  if (!cachedConfig.ragflow.queryPath) {
    console.warn('RAGFLOW_QUERY_PATH is not configured. Update your environment to enable RAGFlow queries.');
  }

  return cachedConfig;
}

module.exports = {
  getConfig,
};
