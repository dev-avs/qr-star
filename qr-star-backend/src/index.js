// Imports
require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const jwtUtil = require("../utils/jwt.js");
const sessionUtil = require("../utils/session.js");
const random = require("../utils/random.js");
const kv = require("../utils/kv.js");
const passwords = require("../utils/password.js");
const cors = require("cors");
// Variables
const models = require("../database/models.js");

// Configuration / Env
const config = require("../config.js");
const ProxyTypes = config.proxytypes;
const trust_proxy = config.app_trust_proxy.toLowerCase() === "true";
const mongo_url =
  config.mongo_url ||
  `mongodb://${config.mongo_host}:${config.mongo_port}/${config.mongo_db}`;
const debug_level = config.debug_level;

// Utils
function getIp(req) {
  if (trust_proxy) {
    const header =
      config.app_proxy_header ||
      ProxyTypes[config.app_proxy_type.toLowerCase()];
    return rateLimit.ipKeyGenerator(req.ip || req.headers[header] || "unknown");
  } else {
    return rateLimit.ipKeyGenerator(
      req.ip || req.connection.remoteAddress || "unknown"
    );
  }
}

// App Initialization
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (trust_proxy) {
  app.set("trust proxy", true);
  if (debug_level > 1) {
    console.log("Trusting proxy headers for IP detection");
  }
}
app.use((req, res, next) => {
  res.err = function (message = "", code = 500) {
    res.status(code || 500);
    return res.send({ error: true, message: message });
  };
  res.success = function (message = "", code = 200) {
    res.status(code || 500);
    return res.send({ error: false, message: message });
  };
  req.realip = getIp(req);
  next();
});

// Rate Limiting
const apiLimiter = rateLimit({
  keyGenerator: getIp,
  validate: { trustProxy: false },
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: true,
    message: "Too many requests to api, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  keyGenerator: getIp,
  validate: { trustProxy: false },
  message: {
    error: true,
    message: "Too many requests (global), please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: getIp,
  validate: { trustProxy: false },
  message: {
    error: true,
    message: "Too many requests (strict), please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const maxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  keyGenerator: getIp,
  validate: { trustProxy: false },
  message: {
    error: true,
    message: "Too many requests (max), please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// DB
mongoose
  .connect(mongo_url)
  .then(async () => {
    console.log(
      `Connected to MongoDB${debug_level >= 2 ? ` at ${mongo_url}` : ""}`
    );
    let first_startup = await kv.get("first_startup");
    if (!first_startup) {
      first_startup = false;
      await kv.set("first_startup", true);
    }
    if (debug_level > 2) {
      console.log("First startup check:", first_startup);
    }
    if (!first_startup) {
      const randomPassword = random(50, false);
      await kv.set("random_password", randomPassword);
      const newUser = new models.user({
        username: "admin",
        passwordHash: await passwords.hashPassword(
          passwords.sha256(randomPassword)
        ),
        id: random(32),
        level: 2,
        display: "QR-Star Site Admin",
      });
      await newUser.save();
      console.log(
        `🚀🔐 First startup detected. Created admin user with username 'admin' and password '${randomPassword}'.`
      );
    } else {
      if (debug_level > 2) {
        const adminPW = await kv.get("random_password");
        console.log(`🔐 Initial admin user password: ${adminPW}`);
      }
    }
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Endpoint Handler

const walkSync = (dir) => {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error("Invalid directory path");
  }
  const files = fs.readdirSync(dir);
  let ret = [];
  for (let file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      let otherfiles = walkSync(filePath);
      ret.push(...otherfiles);
    } else if (path.extname(file) == ".js" || path.extname(file) == ".html") {
      ret.push(filePath);
    }
  }
  return ret;
};
const rootDir = path.resolve(__dirname, "..");

const endpointFiles = walkSync("endpoints");
for (let endpointfile of endpointFiles) {
  endpointfile = path.join(process.cwd(), endpointfile);
  if (!endpointfile.endsWith(".js")) continue;
  const EPCL = require(endpointfile);
  if (typeof EPCL !== "function") {
    console.log(`File at ${endpointfile} doesn't have a proper class`);
    continue;
  }
  const endpoint = new EPCL();
  if (
    !endpoint ||
    typeof endpoint.path !== "string" ||
    typeof endpoint.run !== "function"
  ) {
    console.log(`Invalid endpoint module at ${endpointfile}`);
    continue;
  }

  async function mw(req, res, next) {
    if (endpoint.login) {
      if (!req.headers.login) {
        return res.err("Unauthorized 6", 401);
      }
      try {
        const userinfo = jwtUtil.verify(req.headers.login);
        if (userinfo == 0) return res.err("Unauthorized 7", 401);
        const user = await models.user.findOne({
          id: userinfo.id,
        });
        if (!user) {
          return res.err("Unauthorized 8", 404);
        }
        if (!userinfo.token) {
          return res.err("Unauthorized 9", 401);
        }
        const session = await sessionUtil.verifySession(
          userinfo.id,
          userinfo,
          req.realip
        );
        if (session.error) {
          console.log(session.message);
          return res.err(session.message, 401);
        }
        if (session.session.userid !== user.id) {
          console.log(session, user);
          return res.err("Unauthorized 10", 401);
        }
        if (session.session.token !== userinfo.token) {
          return res.err("Unauthorized 11", 401);
        }
        if (session.session.expiresAt < Date.now()) {
          return res.err("Unauthorized 12", 401);
        }
        req.user = user;
        if (endpoint.admin) {
          if (user.level < 1) {
            return res.err("Forbidden", 403);
          }
        }
        if (endpoint.siteadmin) {
          if (user.level < 2) {
            return res.err("Forbidden", 403);
          }
        }
      } catch (e) {
        if (debug_level > 2) {
          console.error(
            `Error verifying token for user ${req.session.user} at ${endpointfile}:`,
            e
          );
        }
        if (err.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ error: true, message: "Token expired" });
        } else if (err.name === "JsonWebTokenError") {
          return res
            .status(401)
            .json({ error: true, message: "Invalid token" });
        } else if (err.name === "NotBeforeError") {
          return res
            .status(401)
            .json({ error: true, message: "Token not active yet" });
        }
        return res
          .status(500)
          .json({ error: true, message: "Failed to authenticate token" });
      }
      if (debug_level >= 3) {
        console.log(`User ${user.username} is accessing ${endpoint.path}`);
      }
    }
    if (debug_level >= 3) {
      console.log(
        `Request to ${endpoint.path} from ${req.ip} with method ${req.method}`
      );
    }
    next();
  }

  async function hndlr(req, res) {
    try {
      await endpoint.run(req, res);
    } catch (e) {
      console.error(
        `Endpoint ${
          endpoint.path
        } at ${endpointfile} had an error:\n${require("util").inspect(e)}`
      );
      res.err("Internal server error", 500);
    }
  }

  if (!endpoint.strict) {
    if (endpoint.path.startsWith("/api/")) {
      app[endpoint.type || "get"](endpoint.path, apiLimiter, mw, hndlr);
      if (debug_level >= 2)
        console.log(`API rate limit applied to ${endpoint.path}`);
    } else {
      app[endpoint.type || "get"](endpoint.path, mw, hndlr);
    }
  } else {
    app[endpoint.type || "get"](endpoint.path, strictLimiter, mw, hndlr);
    if (debug_level >= 2)
      console.log(`Strict rate limit applied to ${endpoint.path}`);
  }
  if (debug_level > 1)
    console.log(
      `Loaded ${endpoint.path} ${
        endpoint.type ? endpoint.type.toUpperCase() : "GET"
      } endpoint`
    );
}

app.all("/:linkid", maxLimiter, async (req, res, next) => {
  const linkid = req.params.linkid;
  if (!linkid) return next();
  const link = await models.links.findOne({ id: linkid });
  if (!link) return next();
  link.clicks = link.clicks + 1;
  await link.save();
  return res.redirect(link.content);
});

app.listen(config.app_port, config.app_host, () => {
  console.log(
    `QR-Star is running at http://${config.app_host}:${config.app_port}`
  );
});
