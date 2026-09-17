const express = require('express');
const router = express.Router();
const { signToken } = require('./token');
const { hashPassword, comparePassword } = require('./password');
const { getUserByEmail, createUser } = require('../tools/users-db');

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashed = hashPassword(password);
  const newUser = await createUser(username, email, hashed);

  const token = signToken({ userId: newUser.id });
  res.json({ token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  if (!user || !comparePassword(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken({ userId: user.id });
  res.json({ token });
});

module.exports = router;