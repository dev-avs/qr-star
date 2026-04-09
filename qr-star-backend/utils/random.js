// Random token generator
// Generates a random token of specified length using characters from a given set and add a uuid v7 to it
const uuid = require("uuid");

function generateToken(length = 32, uuidAdded = true) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters[randomIndex];
  }

  // Append a UUID v7 to the token
  if (uuidAdded) token += "|" + uuid.v7();

  return token;
}
module.exports = generateToken;
