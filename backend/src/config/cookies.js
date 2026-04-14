const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

const resolveSameSiteValue = () => {
  const configured = String(process.env.COOKIE_SAMESITE || '').trim().toLowerCase();
  if (['lax', 'strict', 'none'].includes(configured)) {
    return configured;
  }

  return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
};

const resolveSecureValue = (sameSite) => {
  const defaultSecure = process.env.NODE_ENV === 'production';
  const configuredSecure = parseBoolean(process.env.COOKIE_SECURE, defaultSecure);

  // Browsers reject SameSite=None cookies when Secure is false.
  if (sameSite === 'none') {
    return true;
  }

  return configuredSecure;
};

const buildHttpOnlyCookieBase = () => {
  const sameSite = resolveSameSiteValue();
  return {
    httpOnly: true,
    secure: resolveSecureValue(sameSite),
    sameSite,
    path: '/',
  };
};

const getRefreshTokenCookieOptions = () => ({
  ...buildHttpOnlyCookieBase(),
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
});

const getRefreshTokenClearCookieOptions = () => buildHttpOnlyCookieBase();

const getOAuthCookieOptions = () => ({
  httpOnly: true,
  secure: parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  sameSite: 'lax',
  path: '/',
  maxAge: OAUTH_STATE_MAX_AGE_MS,
});

const getOAuthClearCookieOptions = () => ({
  httpOnly: true,
  secure: parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  sameSite: 'lax',
  path: '/',
});

module.exports = {
  getRefreshTokenCookieOptions,
  getRefreshTokenClearCookieOptions,
  getOAuthCookieOptions,
  getOAuthClearCookieOptions,
};
