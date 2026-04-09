const models = require("../../database/models.js");
const validators = require("../../utils/validators.js");
const passwordUtil = require("../../utils/password.js");
module.exports = class newEndpoint {
  path = "/api/users/changepassword";
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
    if (!req.user) return res.err("Unauthorized 3", 401);
    if (req.user.level <= 0) return res.err("Unauthorized 4", 401);
    let { username, password } = req.body;
    if (username) {
      if (req.user.level < 1) return res.err("Unauthorized ", 401);
    }
    if (!username) {
      username = req.user.username;
    }

    try {
      const userToEdit = await models.user.findOne({ username });
      if (!userToEdit) {
        return res.status(404).json({
          error: true,
          message: "User not found",
        });
      }

      if (req.user.level <= 1 && userToedit.level > req.user.level) {
        return res.status(403).json({
          error: true,
          message: "You do not have permission to edit users with this level",
        });
      }
      if (!validators.password(password))
        return res.err(
          "Password must be between 8 and 128 characters, and have 1 special character"
        );
      userToEdit.passwordHash = await passwordUtil.hashPassword(password);
      await userToEdit.save()
      return res.status(200).json({
        error: false,
        message: `User '${username}' edited successfully`,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({
        error: true,
        message: "Internal server error",
      });
    }
  }
};
