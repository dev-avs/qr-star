require("dotenv").config();
const debug_level_num = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

let conf = {
  mongo_port: process.env.MONGO_PORT || "27017",
  mongo_host: process.env.MONGO_HOST || "localhost",
  mongo_db: process.env.MONGO_DB || "qr_star",
  mongo_url: process.env.MONGO_URL,
  app_port: process.env.APP_PORT || "3000",
  app_host: process.env.APP_HOST || "0.0.0.0",
  app_trust_proxy: process.env.APP_TRUST_PROXY || "false",
  app_proxy_type: process.env.APP_PROXY_TYPE || "cloudflare",
  app_proxy_header: process.env.APP_PROXY_HEADER,
  app_jwt_secret: process.env.APP_JWT_SECRET, // REQUIRED
  app_hmac_secret: process.env.APP_HMAC_SECRET, // REQUIRED
  app_jwt_issuer: process.env.APP_JWT_ISSUER || "QR-Star",
  app_jwt_length: process.env.APP_JWT_LENGTH || 86400000,
  app_port: process.env.APP_PORT || "3000",
  session_ip_locked: process.env.SESSION_IP_LOCKED === "true",
  captcha_type: process.env.CAPTCHA_TYPE || "none",
  captcha_site_key: process.env.CAPTCHA_SITE_KEY || "",
  captcha_secret_key: process.env.CAPTCHA_SECRET_KEY || "",
  captcha_enabled: process.env.CAPTCHA_ENABLED === "true",
  debug_level: debug_level_num[process.env.DEBUG_LEVEL] || 0,
  proxytypes: {
    cloudflare: { header: "CF-Connecting-IP" },
    aws: { header: "X-Forwarded-For" },
    nginx: { header: "X-Real-IP" },
    caddy: { header: "X-Forwarded-For" },
    traefik: { header: "X-Forwarded-For" },
    haproxy: { header: "X-Forwarded-For" },
    apache: { header: "X-Forwarded-For" },
  },
};

const required = ["app_jwt_secret", "app_hmac_secret"];
for (const key of required) {
  if (!conf[key]) {
    throw new Error(
      `Configuration error: ${key} is required but not set. ${
        conf.debug_level > 0 ? `Value is :${conf[key]}` : ""
      }`
    );
  }
}

module.exports = conf;
