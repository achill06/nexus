const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const TOKEN_KEY = 'nexus_token';
const MATCHES_CACHE_PREFIX = 'nexus_matches_';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getMatchesCacheKey(userId) {
  return `${MATCHES_CACHE_PREFIX}${userId}`;
}

export function clearMatchesCache() {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);

    if (key?.startsWith(MATCHES_CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

function cacheMatches(userId, matches) {
  localStorage.setItem(
    getMatchesCacheKey(userId),
    JSON.stringify(matches)
  );
}

let matchCacheVersion = 0;

export function invalidateMatchesCache(userId) {
  matchCacheVersion += 1;

  if (userId) {
    localStorage.removeItem(getMatchesCacheKey(userId));
  } else {
    clearMatchesCache();
  }

  return matchCacheVersion;
}

export function getMatchesCacheVersion() {
  return matchCacheVersion;
}

/**
 * Calculate and cache matches immediately after a successful
 * resume upload.
 *
 * The resume upload itself remains successful even if match
 * calculation fails. In that case, Matches will calculate normally
 * when opened.
 */
async function precomputeMatchesAfterResumeUpload() {
  const version = invalidateMatchesCache();

  try {
    const me = await request('/me');

    const { matches } = await request(
      '/matching/matches?limit=10'
    );

    if (Array.isArray(matches) && version === matchCacheVersion) {
      cacheMatches(me.userId, matches);

      window.dispatchEvent(
        new Event('nexus:matches-ready')
      );
    }
  } catch (err) {
    console.warn(
      'Could not precompute matches after resume upload:',
      err
    );
  }
}

/**
 * Core request helper.
 *
 * Attaches the Bearer token automatically, JSON-encodes plain
 * objects, leaves FormData alone for resume uploads, and throws
 * ApiError with the server's { message } on non-2xx responses.
 *
 * On 401, clears the stored token and fires a window event.
 * AuthContext listens for this and logs the user out.
 */
async function request(
  path,
  {
    method = 'GET',
    body,
    isFormData = false,
  } = {}
) {
  const headers = {};

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    !isFormData &&
    body !== undefined
  ) {
    headers['Content-Type'] = 'application/json';
  }

  let response;

  try {
    response = await fetch(
      `${BASE_URL}${path}`,
      {
        method,
        headers,
        body: isFormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
      }
    );
  } catch {
    throw new ApiError(
      'Could not reach the server. Is it running?',
      0
    );
  }

  // A 401 only means the session is invalid if we actually sent
  // a token. Login/signup can also legitimately return 401.
  if (response.status === 401 && token) {
    clearToken();

    window.dispatchEvent(
      new Event('nexus:unauthorized')
    );

    throw new ApiError(
      'Session expired. Please log in again.',
      401
    );
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Non-JSON body — leave data as null.
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message ||
        `Request failed (${response.status})`,
      response.status
    );
  }

  return data;
}

export const api = {
  get: (path) => request(path),

  post: (path, body) =>
    request(path, {
      method: 'POST',
      body,
    }),

  postForm: async (path, formData) => {
    const result = await request(path, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });

    // A successful new resume upload immediately triggers
    // match calculation.
    if (path === '/matching/resume') {
      precomputeMatchesAfterResumeUpload();
    }

    return result;
  },

  del: (path) =>
    request(path, {
      method: 'DELETE',
    }),
};