const Redis = require('ioredis');
const env = require('./env');

class MemoryStoreFallback {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    if (this.ttls.has(key) && Date.now() > this.ttls.get(key)) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    if (mode === 'EX' && duration) {
      this.ttls.set(key, Date.now() + duration * 1000);
    }
    return 'OK';
  }

  async del(key) {
    const deleted = this.store.delete(key);
    this.ttls.delete(key);
    return deleted ? 1 : 0;
  }

  async incr(key) {
    let current = parseInt(await this.get(key) || '0', 10);
    current += 1;
    this.store.set(key, current.toString());
    return current;
  }

  async expire(key, seconds) {
    if (this.store.has(key)) {
      this.ttls.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }
}

let redisClient;
let isUsingMemoryFallback = false;

try {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Do not spam reconnects if offline
    lazyConnect: true,
  });

  client.on('error', (err) => {
    if (!isUsingMemoryFallback) {
      console.log('ℹ️ Redis offline or unavailable. Switched to high-speed in-memory session/OTP store.');
      isUsingMemoryFallback = true;
    }
  });

  // Attempt async connect
  client.connect().catch(() => {
    isUsingMemoryFallback = true;
  });

  const memoryFallback = new MemoryStoreFallback();

  redisClient = new Proxy(client, {
    get(target, prop) {
      if (isUsingMemoryFallback || target.status !== 'ready') {
        if (typeof memoryFallback[prop] === 'function') {
          return memoryFallback[prop].bind(memoryFallback);
        }
      }
      return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
    },
  });
} catch (e) {
  isUsingMemoryFallback = true;
  redisClient = new MemoryStoreFallback();
}

module.exports = redisClient;
