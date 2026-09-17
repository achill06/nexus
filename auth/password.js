const bcrypt = require('bcrypt');
  
function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, 10);
}
function comparePassword(plainPassword, hash) {
  return bcrypt.compareSync(plainPassword, hash);
}

module.exports = { hashPassword, comparePassword };