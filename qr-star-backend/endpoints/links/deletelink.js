const models = require("../../database/models.js");
module.exports = class newEndpoint {
  path = "/api/links/delete";
  type = "post";
  strict = true;
  login = true;
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  async run(req, res) {
    let { linkid } = req.body;
    if (!linkid) return res.err("You must provide a link id to delete");
    const existing = await models.links.findOne({ id: linkid });
    if (!existing) return res.err("This link does not exist");
    if (existing.creator !== req.user.id && req.user.level < 2) {
      return res.err("This is not your link, you cannot delete it");
    }
    await existing.deleteOne();
    res.success("Deleted successfully");
  }
};
