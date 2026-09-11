const redisClient = require('../config/redis');

/**
 * Creates a rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowSec - Window duration in seconds
 * @param {number} options.max - Maximum allowed requests within the window
 * @param {string} options.keyPrefix - Identifier prefix
 */
function rateLimiter({ windowSec = 60, max = 30, keyPrefix = 'rl' } = {}) {
  return async (req, res, next) => {
    try {
      const identifier = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const key = `${keyPrefix}:${identifier}`;

      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, windowSec);
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Rate limit exceeded. Please retry later.',
          retryAfterSec: windowSec,
        });
      }

      next();
    } catch (err) {
      // In case of rate limiter error, fail-open to not block emergency traffic
      next();
    }
  };
}

module.exports = {
  rateLimiter,
  authLimiter: rateLimiter({ windowSec: 60, max: 15, keyPrefix: 'auth_rl' }),
  otpLimiter: rateLimiter({ windowSec: 300, max: 5, keyPrefix: 'otp_rl' }),
  emergencyLimiter: rateLimiter({ windowSec: 60, max: 120, keyPrefix: 'emg_rl' }),
};
