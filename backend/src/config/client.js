const DEFAULT_CLIENT_URL = 'http://localhost:5173';
const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const VERCEL_PREVIEW_ORIGIN_PATTERN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

const normalizeOrigin = (value = '') => String(value).trim().replace(/\/+$/, '');

const parseOriginList = (value = '') => String(value)
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const getConfiguredClientOrigins = () => {
  const configuredOrigins = [
    ...parseOriginList(process.env.CLIENT_URL),
    ...parseOriginList(process.env.CLIENT_URLS),
  ];

  if (!configuredOrigins.length) {
    return [DEFAULT_CLIENT_URL];
  }

  return [...new Set(configuredOrigins)];
};

const getAllowedClientOrigins = () => getConfiguredClientOrigins();

const getPrimaryClientUrl = () => getAllowedClientOrigins()[0] || DEFAULT_CLIENT_URL;

const allowVercelPreviews = () => parseBoolean(process.env.ALLOW_VERCEL_PREVIEWS, false);
const allowLocalhostOrigins = () => parseBoolean(
  process.env.ALLOW_LOCALHOST_ORIGINS,
  process.env.NODE_ENV !== 'production'
);

const isAllowedClientOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (allowLocalhostOrigins() && LOCALHOST_ORIGIN_PATTERN.test(normalizedOrigin)) {
    return true;
  }

  if (getAllowedClientOrigins().includes(normalizedOrigin)) {
    return true;
  }

  return allowVercelPreviews() && VERCEL_PREVIEW_ORIGIN_PATTERN.test(normalizedOrigin);
};

module.exports = {
  getAllowedClientOrigins,
  getPrimaryClientUrl,
  isAllowedClientOrigin,
};
