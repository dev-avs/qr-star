const models = require("../../database/models.js");
const sanitizeUtil = require("../../utils/sanitize.js")
module.exports = class newEndpoint {
  path = "/api/users/me";
  type = "get";
  strict = true;
  login = true;
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  async run(req, res) {
    if (!req.user) return res.err("Unauthorized 5", 401);
    return res.success(sanitizeUtil.sanitizeUsers(req.user.toJSON()));
  }
};
