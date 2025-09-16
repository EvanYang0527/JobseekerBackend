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

const ALLOWED_WOOP_TIMEFRAMES = new Set(['24h', '4w', '3-12m', 'none']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clonePlainObject(value) {
  return value ? JSON.parse(JSON.stringify(value)) : {};
}

function createBadRequestError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function hasContent(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasContent(item));
  }

  if (isPlainObject(value)) {
    return Object.values(value).some((item) => hasContent(item));
  }

  return true;
}

function ensureHasContent(value, fieldName) {
  if (!hasContent(value)) {
    throw createBadRequestError(`${fieldName} is required.`);
  }
}

function normalizeTimeframe(timeframe) {
  if (timeframe === undefined || timeframe === null || timeframe === '') {
    return 'none';
  }

  const normalized = String(timeframe)
    .trim()
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-');

  if (!normalized) {
    return 'none';
  }

  if (!ALLOWED_WOOP_TIMEFRAMES.has(normalized)) {
    const allowed = Array.from(ALLOWED_WOOP_TIMEFRAMES).join(', ');
    throw createBadRequestError(`timeframe must be one of: ${allowed}.`);
  }

  return normalized;
}

function formatKey(key) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatPlainValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatPlainValue(item))
      .filter(Boolean)
      .join(', ');
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, val]) => {
        const formatted = formatPlainValue(val);
        if (!formatted) {
          return null;
        }
        return `${formatKey(key)}: ${formatted}`;
      })
      .filter(Boolean)
      .join('; ');
  }

  return String(value);
}

function formatPersonalInfo(personalInfo) {
  if (typeof personalInfo === 'string') {
    return personalInfo.trim();
  }

  if (Array.isArray(personalInfo)) {
    const lines = personalInfo
      .map((item) => formatPlainValue(item))
      .filter(Boolean);

    return lines.length > 0 ? lines.map((line) => `- ${line}`).join('\n') : '';
  }

  if (isPlainObject(personalInfo)) {
    const lines = Object.entries(personalInfo)
      .map(([key, value]) => {
        const formattedValue = formatPlainValue(value);
        if (!formattedValue) {
          return null;
        }
        return `- ${formatKey(key)}: ${formattedValue}`;
      })
      .filter(Boolean);

    return lines.length > 0 ? lines.join('\n') : '';
  }

  if (personalInfo === null || personalInfo === undefined) {
    return '';
  }

  return String(personalInfo);
}

function formatGoals(goals) {
  if (Array.isArray(goals)) {
    const lines = goals
      .map((goal, index) => {
        const text = formatPlainValue(goal);
        if (!text) {
          return null;
        }
        return `${index + 1}. ${text}`;
      })
      .filter(Boolean);

    return lines.length > 0 ? lines.join('\n') : '';
  }

  return formatPlainValue(goals);
}

function formatResources(resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return 'No personalized learning resources were returned.';
  }

  const lines = resources
    .map((resource, index) => {
      if (resource === null || resource === undefined) {
        return null;
      }

      if (typeof resource === 'string') {
        const trimmed = resource.trim();
        return trimmed ? `${index + 1}. ${trimmed}` : null;
      }

      if (isPlainObject(resource)) {
        const title =
          formatPlainValue(resource.title) ||
          formatPlainValue(resource.name) ||
          `Resource ${index + 1}`;
        const url = formatPlainValue(resource.url) || formatPlainValue(resource.link);
        const summary =
          formatPlainValue(resource.summary) ||
          formatPlainValue(resource.description) ||
          formatPlainValue(resource.notes) ||
          '';

        const extraFields = ['skills', 'topics', 'level', 'format', 'duration'];
        const extras = extraFields
          .map((field) => {
            if (!resource[field]) {
              return null;
            }
            const formatted = formatPlainValue(resource[field]);
            if (!formatted) {
              return null;
            }
            return `${formatKey(field)}: ${formatted}`;
          })
          .filter(Boolean);

        let details = summary;
        if (extras.length > 0) {
          details = details ? `${details} | ${extras.join(' | ')}` : extras.join(' | ');
        }

        let line = `${index + 1}. ${title}`;
        if (url) {
          line += ` (${url})`;
        }
        if (details) {
          line += ` - ${details}`;
        }

        return line;
      }

      const fallback = String(resource).trim();
      return fallback ? `${index + 1}. ${fallback}` : null;
    })
    .filter(Boolean);

  if (lines.length === 0) {
    return 'No personalized learning resources were returned.';
  }

  return lines.join('\n');
}

function buildWoopPrompt({
  personalInfo,
  currentSkill,
  goals,
  timeframe,
  resources,
}) {
  const personalInfoText = formatPersonalInfo(personalInfo) || 'Not provided.';
  const currentSkillText = formatPlainValue(currentSkill) || 'Not provided.';
  const goalsText = formatGoals(goals) || 'Not provided.';
  const resourcesText = formatResources(resources);

  return [
    'You are an AI coach specialized in the WOOP (Wish, Outcome, Obstacle, Plan) method for behavior change.',
    'Create a WOOP coaching report for the learner using the information provided below.',
    'Requirements:',
    `- Wish: Use the "${timeframe}" timeframe. Provide a 3-6 word statement describing a challenging yet achievable wish.`,
    '- Best Outcome: Provide a 3-6 word statement and include a short vivid visualization so the learner can imagine success clearly.',
    '- Inner Obstacle: Identify a personal habit, emotion, or belief in 3-6 words and include a short visualization describing how it shows up.',
    '- Plan: Produce an If-Then plan that directly addresses the inner obstacle. Reference the most relevant learning resources from the list below, briefly explaining how each resource supports the plan. If no resources are relevant, return an empty array.',
    'Context:',
    `Personal information:\n${personalInfoText}`,
    `Current skill level:\n${currentSkillText}`,
    `Primary goals:\n${goalsText}`,
    `Learning resources retrieved from the knowledge base:\n${resourcesText}`,
    'Respond exclusively with compact JSON following this structure:',
    '{',
    '  "wish": { "timeframe": "<timeframe>", "statement": "<3-6 word wish>" },',
    '  "bestOutcome": { "statement": "<3-6 word outcome>", "visualization": "<short vivid description>" },',
    '  "innerObstacle": { "statement": "<3-6 word obstacle>", "visualization": "<short visualization>" },',
    '  "plan": { "ifThen": "If <trigger>, then <action>", "resources": [ { "title": "<resource title>", "url": "<link or empty string>", "reason": "<short justification>" } ] }',
    '}',
    'No additional commentary, markdown, or explanation. Ensure every string respects the required word counts.',
  ].join('\n\n');
}

function setByPath(target, path, value) {
  if (!path) {
    return;
  }

  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return;
  }

  let current = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i];
    if (!isPlainObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }

  current[segments[segments.length - 1]] = value;
}

function buildWoopPayload(ragflowOptions, prompt) {
  if (!isPlainObject(ragflowOptions)) {
    return { query: prompt };
  }

  const { payload: providedPayload, promptField, appendAsMessage } = ragflowOptions;

  let payload;

  if (isPlainObject(providedPayload)) {
    payload = clonePlainObject(providedPayload);
  } else {
    const cloned = clonePlainObject(ragflowOptions);
    delete cloned.payload;
    delete cloned.promptField;
    delete cloned.appendAsMessage;
    payload = cloned;
  }

  if (promptField) {
    setByPath(payload, promptField, prompt);
    return payload;
  }

  if (appendAsMessage || Array.isArray(payload.messages)) {
    const messages = Array.isArray(payload.messages) ? payload.messages.slice() : [];
    messages.push({ role: 'user', content: prompt });
    payload.messages = messages;
    return payload;
  }

  if (isPlainObject(payload.query)) {
    payload.query.prompt = prompt;
    return payload;
  }

  if (typeof payload.prompt === 'string' || payload.prompt === undefined) {
    payload.prompt = prompt;
    return payload;
  }

  payload.query = prompt;
  return payload;
}

async function generateWoopReport(requestBody = {}) {
  const {
    personalInfo,
    currentSkill,
    goals,
    timeframe,
    resources = [],
    ragflow,
  } = requestBody;

  ensureHasContent(personalInfo, 'personalInfo');
  ensureHasContent(currentSkill, 'currentSkill');
  ensureHasContent(goals, 'goals');

  const normalizedTimeframe = normalizeTimeframe(timeframe);
  const prompt = buildWoopPrompt({
    personalInfo,
    currentSkill,
    goals,
    timeframe: normalizedTimeframe,
    resources,
  });

  const payload = buildWoopPayload(ragflow, prompt);

  return runQuery(payload);
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
  generateWoopReport,
};
