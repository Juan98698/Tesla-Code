import { createHmac } from 'node:crypto';
import { TutorError } from './protocol.mjs';

// One atomic operation checks every limit before reserving a provider request.
// Only counters and a daily HMAC of the IP are stored, never conversations or code.
export const QUOTA_SCRIPT = `
for i=1,3 do
  if tonumber(redis.call('GET', KEYS[i]) or '0') >= tonumber(ARGV[i]) then
    return {i, math.max(1, redis.call('TTL', KEYS[i]))}
  end
end
for i=1,3 do
  if redis.call('INCR', KEYS[i]) == 1 then redis.call('EXPIRE', KEYS[i], ARGV[i+3]) end
end
return {0,0}`;

export const production = (env) => env.VERCEL === '1' || env.NODE_ENV === 'production';
const number = (value, fallback, max) => {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max)
    throw new Error('Invalid quota configuration');
  return parsed;
};
export function quotaConfig(env) {
  const limits = [
    number(env.TUTOR_PER_MINUTE, 20, 1000),
    number(env.TUTOR_PER_IP_DAY, 200, 10000),
    number(env.TUTOR_GLOBAL_DAY, 1000, 100000),
  ];
  const remote = Boolean(
    env.UPSTASH_REDIS_REST_URL &&
    env.UPSTASH_REDIS_REST_TOKEN &&
    env.TUTOR_IP_HASH_SECRET?.length >= 32,
  );
  if (remote) {
    const url = new URL(env.UPSTASH_REDIS_REST_URL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
      throw Error('Invalid quota service URL');
  }
  if (production(env) && !remote) throw Error('Shared quotas must be configured');
  return { limits, remote };
}
export function createQuota(env, fetcher = fetch, clock = Date.now) {
  const local = new Map();
  return async function reserve(ip) {
    const config = quotaConfig(env),
      now = clock(),
      day = Math.floor(now / 86400000),
      minute = Math.floor(now / 60000);
    const identity = createHmac('sha256', env.TUTOR_IP_HASH_SECRET || 'local-development-only')
      .update(`${day}:${ip}`)
      .digest('hex')
      .slice(0, 32);
    const keys = [
      `tesla:tutor:v1:m:${minute}:${identity}`,
      `tesla:tutor:v1:d:${day}:${identity}`,
      `tesla:tutor:v1:global:${day}`,
    ];
    const ttl = [
      61,
      Math.ceil(((day + 1) * 86400000 - now) / 1000) + 1,
      Math.ceil(((day + 1) * 86400000 - now) / 1000) + 1,
    ];
    let result;
    if (config.remote) {
      let response, value;
      try {
        response = await fetcher(env.UPSTASH_REDIS_REST_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            'EVAL',
            QUOTA_SCRIPT,
            '3',
            ...keys,
            ...config.limits.map(String),
            ...ttl.map(String),
          ]),
          signal: AbortSignal.timeout(3000),
          redirect: 'error',
        });
        if (!response.ok) throw Error('Quota unavailable');
        value = await response.json();
        if (
          !Array.isArray(value.result) ||
          value.result.length !== 2 ||
          !value.result.every(Number.isInteger) ||
          value.result[0] < 0 ||
          value.result[0] > 3 ||
          value.result[1] < 0
        )
          throw Error('Invalid quota response');
      } catch {
        throw new TutorError(
          503,
          'quota_unavailable',
          'El tutor no está disponible en este momento. Intenta más tarde.',
        );
      }
      result = value.result;
    } else {
      for (const [key, value] of local) if (value.expires <= now) local.delete(key);
      // Local-only memory is bounded even when a test or script changes IPs repeatedly.
      if (local.size > 10000)
        throw new TutorError(503, 'quota_unavailable', 'El tutor está ocupado. Intenta más tarde.');
      const exceeded = keys.findIndex(
        (key, index) => (local.get(key)?.count ?? 0) >= config.limits[index],
      );
      result =
        exceeded < 0
          ? [0, 0]
          : [
              exceeded + 1,
              Math.max(1, Math.ceil((local.get(keys[exceeded]).expires - now) / 1000)),
            ];
      if (!result[0])
        keys.forEach((key, index) => {
          const old = local.get(key);
          local.set(key, {
            count: (old?.count ?? 0) + 1,
            expires: old?.expires ?? now + ttl[index] * 1000,
          });
        });
    }
    if (result[0])
      throw new TutorError(
        429,
        'quota_exceeded',
        result[0] === 3
          ? 'El tutor alcanzó su límite de consultas de hoy. Puedes continuar con las lecciones.'
          : 'Alcanzaste el límite temporal de consultas de tu conexión. Intenta más tarde.',
        Math.max(1, result[1]),
      );
  };
}
