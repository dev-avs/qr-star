const models = require("../../database/models.js");
const sanitizeUtil = require("../../utils/sanitize.js");
module.exports = class newEndpoint {
  path = "/api/siteadmin/users/list";
  type = "get";
  login = true;
  siteadmin = true;
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  async run(req, res) {
    const users = await models.user.find({}).lean();
    return res.success(sanitizeUtil.sanitizeUsers(users));
  }
};
