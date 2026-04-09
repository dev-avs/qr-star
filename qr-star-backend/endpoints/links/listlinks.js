const models = require("../../database/models.js");
const sanitize = require("../../utils/sanitize.js");
module.exports = class newEndpoint {
  path = "/api/links/list";
  type = "get";
  login = true;
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  async run(req, res) {
    const existing = await models.links.find({ creator: req.user.id });
    if (!existing.length) return res.success([]);
    res.success(sanitize.sanitizeMongo(existing));
  }
};
