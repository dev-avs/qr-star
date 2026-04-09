const models = require("../../database/models.js");
const passwords = require("../../utils/password.js");
const random = require("../../utils/random.js");
const validators = require("../../utils/validators.js");
module.exports = class newEndpoint {
  path = "/api/users/create";
  type = "post";
  strict = true;
  login = true;
  admin = true;
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  async run(req, res) {
    if (!req.user) return res.err("Unauthorized 1", 401);
    if (req.user.level <= 0) return res.err("Unauthorized 2", 401);
    let { username, password, level } = req.body;
    if (!level) level = 0;
    if (!username || !password) {
      return res.status(400).json({
        error: true,
        message: "Username and password are required",
      });
    }
    if (req.user.level <= 1) {
      if (req.user.level <= level) {
        return res.status(403).json({
          error: true,
          message: "You do not have permission to create users with this level",
        });
      }
    }
    if (username.length < 3 || username.length > 32) {
      return res.status(400).json({
        error: true,
        message: "Username must be between 3 and 32 characters",
      });
    }
    if (!validators.password(password)) {
      return res.status(400).json({
        error: true,
        message: "Password must be between 8 and 128 characters, and have 1 special character",
      });
    }
    if (level < 0 || level > 2) {
      return res.status(400).json({
        error: true,
        message: "Level must be between 0 and 2",
      });
    }

    try {
      const existingUser = await models.user.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          error: true,
          message: "Username already exists",
        });
      }
    } catch (error) {
      console.error("Error checking existing user:", error);
      return res.status(500).json({
        error: true,
        message: "Internal server error",
      });
    }

    try {
      const newUser = new models.user({
        username,
        passwordHash: await passwords.hashPassword(password),
        id: random(32),
        level,
      });
      await newUser.save();
      return res.status(201).json({
        error: false,
        message: {
          id: newUser.id,
          username: newUser.username,
          level: newUser.level,
          display: newUser.display,
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({
        error: true,
        message: "Internal server error",
      });
    }
  }
};
