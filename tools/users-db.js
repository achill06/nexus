const {pool} = require('./db-connection.js');
async function getUserByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
}

async function getUserById(id) {
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [id]);
    return result.rows[0];
}

async function createUser(username, email, hashedPassword) {
    const result = await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        [username, email, hashedPassword]
    );
    return result.rows[0];
}
module.exports = { getUserByEmail, getUserById, createUser };