const models = require("../../database/models.js");
module.exports = class newEndpoint {
  path = "/api/users/delete";
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
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({
        error: true,
        message: "Username is required",
      });
    }

    try {
      const userToDelete = await models.user.findOne({ username });
      if (!userToDelete) {
        return res.status(404).json({
          error: true,
          message: "User not found",
        });
      }

      if (req.user.level <= 1 && userToDelete.level > req.user.level) {
        return res.status(403).json({
          error: true,
          message: "You do not have permission to delete users with this level",
        });
      }

      await models.user.deleteOne({ username });
      return res.status(200).json({
        error: false,
        message: `User '${username}' deleted successfully`,
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
