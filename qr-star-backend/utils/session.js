const models = require("../database/models");
const password = require("./password");
const config = require("../config");
const random = require("./random");
async function verifySession(id, userinfo, ip) {
  try {
    if (!ip || !id || !userinfo || !userinfo.token) {
      console.log(id, userinfo, ip);
      return { error: true, message: "Invalid session information" };
    }
    const user = await models.user.findOne({ id });
    if (!user) {
      return { error: true, message: "User not found" };
    }
    if (id !== user.id) {
      return { error: true, message: "User ID mismatch" };
    }
    const session = await models.session.findOne({
      userid: user.id,
      token: userinfo.token,
    });
    if (!session) {
      return { error: true, message: "Session not found" };
    }
    if (config.session_ip_locked) {
      if (session.ip !== ip) {
        return {
          error: true,
          message: "IP address mismatch, please log in again",
        };
      }
    }
    if (session.expiresAt <= new Date()) {
      return { error: true, message: "Session expired" };
    }
    return { error: false, user, session };
  } catch (e) {
    return {
      error: true,
      message: "An error occurred while verifying the session",
    };
  }
}

async function createSession(userid, pw, ip) {
  try {
    if (!userid || !pw || !ip) {
      return { error: true, message: "Invalid user or password or ip" };
    }
    const user = await models.user.findOne({ id: userid });
    if (!user) {
      return { error: true, message: "User not found" };
    }
    const isValid = await password.verifyHash(user.passwordHash, pw);
    if (!isValid) {
      return { error: true, message: "Invalid password" };
    }
    const token = random(64);
    const expiresAt = new Date(Date.now() + config.app_jwt_length);
    await models.session.deleteMany({ ip, userid: user.id });
    const session = new models.session({
      userid: user.id,
      token,
      expiresAt,
      ip,
    });
    await session.save();
    return { error: false, token, expiresAt };
  } catch (e) {
    console.error(e);
    return {
      error: true,
      message: "An error occurred while creating the session",
    };
  }
}

async function deleteSession(userid, token) {
  try {
    if (!userid || !token) {
      return { error: true, message: "Invalid session information" };
    }
    const session = await models.session.findOneAndDelete({
      userid,
      token,
    });
    if (!session) {
      return { error: true, message: "Session not found" };
    }
    return { error: false, message: "Session deleted successfully" };
  } catch (e) {
    return {
      error: true,
      message: "An error occurred while deleting the session",
    };
  }
}

async function deleteSessions(userid) {
  try {
    if (!userid) {
      return { error: true, message: "Invalid user ID" };
    }
    const result = await models.session.deleteMany({ userid });
    if (result.deletedCount === 0) {
      return { error: true, message: "No sessions found for this user" };
    }
    return {
      error: false,
      message: `${result.deletedCount} sessions deleted successfully`,
    };
  } catch (e) {
    return {
      error: true,
      message: "An error occurred while deleting sessions",
    };
  }
}

module.exports = {
  verifySession,
  createSession,
  deleteSession,
  deleteSessions,
};
