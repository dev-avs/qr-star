const models = require("../../database/models.js");
const sanitize = require("../../utils/sanitize.js");
const validators = require("../../utils/validators.js");
module.exports = class newEndpoint {
  path = "/api/links/edit";
  type = "post";
  strict = true;
  login = true;
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  async run(req, res) {
    let { linkid, content, newlinkid } = req.body;
    if (!content)
      return res.err("You must provide some content for your redirect");
    if (!validators.url(content)) return res.err("Content must be a valid url");
    if (!linkid) return res.err("You must provide a link id to edit");
    const existing = await models.links.findOne({ id: linkid });
    if (!existing) return res.err("This link does not exist");
    if (existing.creator !== req.user.id && req.user.level < 2) {
      return res.err("This is not your link, you cannot edit it");
    }
    existing.content = validators.url(content);
    if (newlinkid) {
      if (typeof newlinkid !== "string")
        return res.err("New Link ID must be a string");
      if (newlinkid.length < 1 || newlinkid.length > 50)
        return res.err("New Link ID must be between 1 and 50 characters");
      const ex2 = await models.links.findOne({ id: newlinkid });
      if (ex2) return res.err("New link ID conficts with existing link");
      existing.id = newlinkid;
    }
    await existing.save()
    res.success(sanitize.sanitizeMongo(existing.toJSON()));
  }
};
