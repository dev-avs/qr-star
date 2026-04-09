const models = require("../database/models");

class KVStore {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const doc = await models.kv.findOne({ key });
    const value = doc?.value ?? null;

    this.cache.set(key, value);
    return value;
  }

  async set(key, value) {
    let doc = await models.kv.findOne({ key });

    if (doc) {
      doc.value = value;
      await doc.save();
    } else {
      doc = new models.kv({ key, value });
      await doc.save();
    }

    this.cache.set(key, value);
  }

  clear(key) {
    this.cache.delete(key);
  }

  clearAll() {
    this.cache.clear();
  }
}

module.exports = new KVStore();
