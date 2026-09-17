require('dotenv').config()
const express = require('express');
const authRoutes = require('./auth/auth-routes');
const authMiddleware = require('./auth/auth-middleware');
const {getUserById} = require('./tools/users-db');
const matchingRoutes = require('./routes/matching-routes');
const shortlistRoutes = require('./routes/shortlist-routes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

app.use('/auth', authRoutes);
app.use('/matching',matchingRoutes);
app.use('/shortlist', shortlistRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Nexus Backend",
  });
});

app.get('/me', authMiddleware, async (req, res, next) => {
  try{
    const user = await getUserById(req.userId);
    if(!user) return res.status(404).json({message:'User not found'});
    return res.json({userId:user.id,username:user.username,email:user.email});
  }
  catch(err){return next(err);}
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