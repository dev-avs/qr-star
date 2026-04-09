const models = require("../../database/models.js");
const random = require("../../utils/random.js");
const sanitize = require("../../utils/sanitize.js");
const validators = require("../../utils/validators.js");
module.exports = class newEndpoint {
  path = "/api/links/create";
  type = "post";
  strict = true;
  login = true;
  /**
   *
   * @param {express.Request} req
   * @param {express.Response} res
   */
  async run(req, res) {
    let { linkid, content, qrinfo } = req.body;
    if (!qrinfo || typeof qrinfo !== "object") return res.err("Invalid qrinfo");
    if (!content)
      return res.err("You must provide some content for your redirect");
    if (!validators.url(content)) return res.err("Content must be a valid url");
    if (!linkid) linkid = random(30, false);
    if (typeof linkid !== "string") return res.err("Link ID must be a string");
    if (linkid.length < 1 || linkid.length > 50)
      return res.err("Link ID must be between 1 and 50 characters");
    const existing = await models.links.findOne({ id: linkid });
    if (existing) return res.err("This link already exists");
    const newdata = new models.links({
      id: linkid,
      content: validators.url(content),
      creator: req.user.id,
      qrinfo,
    });
    await newdata.save();
    res.success(sanitize.sanitizeMongo(newdata.toJSON()));
  }
};
