const sessionUtil = require("../../utils/session.js");
const passwords = require("../../utils/password.js");
const models = require("../../database/models.js");
const jwtUtil = require("../../utils/jwt.js");
module.exports = class newEndpoint {
  path = "/api/users/auth";
  type = "get";
  strict = true;
  captcha = true;
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  async run(req, res) {
    const { username, password } = req.headers;
    if (!username || !password) {
      return res.err("Username and password are required", 400);
    }

    try {
      const user = await models.user.findOne({ username });
      if (!user) {
        return res.err("User not found", 404);
      }
      const isPasswordValid = await passwords.verifyHash(
        user.passwordHash,
        password
      );
      if (!isPasswordValid) {
        return res.err("Invalid password", 401);
      }

      const session = await sessionUtil.createSession(
        user.id,
        password,
        req.realip
      );
      if (session.error) {
        return res.status(500).json({
          error: true,
          message: session.message,
        });
      }
      const jwtToken = jwtUtil.generate(user.id, session.token);
      return res.success(jwtToken);
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({
        error: true,
        message: "An error occurred during authentication",
      });
    }
  }
};
