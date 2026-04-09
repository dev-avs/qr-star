const jwt = require("jsonwebtoken");
const config = require("../config.js");

function generateToken(id, token) {
  try {
    if (!config.app_jwt_secret) {
      throw new Error("JWT secret is not set in the configuration.");
    }
    const payload = {
      id,
      token,
    };
    return jwt.sign(payload, config.app_jwt_secret, {
      issuer: config.app_jwt_issuer,
      expiresIn: config.app_jwt_length,
      algorithm: "HS256",
    });
  } catch (e) {
    return 0;
  }
}

function verifyToken(token) {
  if (!config.app_jwt_secret) {
    throw new Error("JWT secret is not set in the configuration.");
  }
  try {
    return jwt.verify(token, config.app_jwt_secret, {
      issuer: config.app_jwt_issuer,
      algorithms: ["HS256"],
      maxAge: config.app_jwt_length,
    });
  } catch (e) {
    console.error(e);
    return 0;
  }
}

module.exports = {
  verify: verifyToken,
  generate: generateToken,
};
