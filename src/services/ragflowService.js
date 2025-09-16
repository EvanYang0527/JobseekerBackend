const axios = require('axios');
const { getConfig } = require('../config/environment');

function buildUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

function buildHeaders(apiKey) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

function mapAxiosError(error) {
  if (error.response) {
    const err = new Error(
      error.response.data?.message ||
        error.response.statusText ||
        'RAGFlow request failed'
    );
    err.status = error.response.status;
    err.data = error.response.data;
    return err;
  }

  if (error.request) {
    const err = new Error('No response received from RAGFlow service.');
    err.status = 504;
    return err;
  }

  return error;
}

async function runQuery(payload) {
  const config = getConfig();
  const { baseUrl, queryPath, apiKey, timeout } = config.ragflow;

  if (!baseUrl) {
    const error = new Error('RAGFLOW_BASE_URL is not configured.');
    error.status = 500;
    throw error;
  }

  if (!queryPath) {
    const error = new Error('RAGFLOW_QUERY_PATH is not configured.');
    error.status = 500;
    throw error;
  }

  try {
    const url = buildUrl(baseUrl, queryPath);
    const response = await axios.post(url, payload, {
      headers: buildHeaders(apiKey),
      timeout,
    });

    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
}

async function listDatasets() {
  const config = getConfig();
  const { baseUrl, datasetsPath, apiKey, timeout } = config.ragflow;

  if (!baseUrl) {
    const error = new Error('RAGFLOW_BASE_URL is not configured.');
    error.status = 500;
    throw error;
  }

  if (!datasetsPath) {
    const error = new Error('RAGFLOW_DATASETS_PATH is not configured.');
    error.status = 501;
    throw error;
  }

  try {
    const url = buildUrl(baseUrl, datasetsPath);
    const response = await axios.get(url, {
      headers: buildHeaders(apiKey),
      timeout,
    });

    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
}

module.exports = {
  runQuery,
  listDatasets,
};
