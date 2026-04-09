const { model, Schema } = require("mongoose");

const linkSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  creator: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  id: { type: String, required: true, unique: true },
  qrinfo: { type: Object, required: true },
});

exports.links = model("Link", linkSchema);

const userSchema = new Schema({
  display: { type: String, required: false },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  level: { type: Number, default: 0 },
  /*
  Levels:
    0: Basic user
    1: Admin
    2: Super Admin (whole site management) 
  */
  id: { type: String, required: true, unique: true },
});

exports.user = model("User", userSchema);

const kvSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}).pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
exports.kv = model("KeyValue", kvSchema);

const sessionSchema = new Schema({
  userid: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  ip: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});
exports.session = model("Session", sessionSchema);
