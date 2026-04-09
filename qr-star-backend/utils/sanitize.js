function sanitizeMongo(obj) {
  if (typeof obj !== "object") throw new TypeError("Mongo must be an obj");
  obj["_id"] = undefined;
  obj["__v"] = undefined;
  return obj;
}

function mongos(mongos) {
  if (typeof mongos !== "object" && !Array.isArray(mongos)) {
    throw new TypeError("Mongos must be object or array of objects");
  }
  if (typeof mongos == "object") return sanitizeMongo(mongos);
  const mongos_ret = [];
  for (const mongo of mongos) {
    mongos_ret.push(sanitizeMongo(mongo));
  }
  return mongos_ret;
}

function sanitizeUser(user) {
  if (typeof user !== "object") throw new TypeError("User must be object");
  user = sanitizeMongo(user);
  user["passwordHash"] = undefined;
  return user;
}

function users(users) {
  if (typeof users !== "object" && !Array.isArray(users)) {
    throw new TypeError("User must be object or array of objects");
  }
  if (typeof users == "object") return sanitizeUser(users);
  const users_ret = [];
  for (const user of users) {
    users_ret.push(sanitizeUser(user));
  }
  return users;
}


exports.sanitizeUsers = users;
exports.sanitizeMongo = mongos;
