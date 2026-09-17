const jwt = require('jsonwebtoken');
const config = require('../tools/config');

const secret = config.jwt.secret;
const expiresIn = config.jwt.expiresIn;

function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn });
}
function verifyToken(token) {
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };