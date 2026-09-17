require('dotenv').config()
const express = require('express');
const authRoutes = require('./auth/auth-routes');
const authMiddleware = require('./auth/auth-middleware');
const matchingRoutes = require('./routes/matching-routes');
const shortlistRoutes = require('./routes/shortlist-routes');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/matching',matchingRoutes);
app.use('/shortlist', shortlistRoutes);

app.get('/me', authMiddleware, (req, res) => {
  res.json({ userId: req.userId });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT|| 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});