const crypto = require("crypto");
const argon2 = require("argon2");
const config = require("../config");
const HMAC_SECRET = config.app_hmac_secret;

function hmacHash(content) {
  if (!HMAC_SECRET) {
    throw new Error("HMAC secret is not set in the configuration.");
  }
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(content)
    .digest("base64url");
}

async function hashPassword(password) {
  if (!HMAC_SECRET) {
    throw new Error("HMAC secret is not set in the configuration.");
  }
  const hmac = hmacHash(password);

  const hash = await argon2.hash(hmac, {
    type: argon2.argon2id,
  });

  return hash;
}

async function verifyHash(storedHash, inputPassword) {
  if (!HMAC_SECRET) {
    throw new Error("HMAC secret is not set in the configuration.");
  }
  const hmac = hmacHash(inputPassword);

  return await argon2.verify(storedHash, hmac);
}


function sha256(string) {
   return crypto
    .createHash("sha256")
    .update(string)
    .digest("base64url");
}

module.exports = {
  hashPassword,
  verifyHash,
  hmacHash,
  sha256
};
