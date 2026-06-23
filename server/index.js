require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT   = process.env.PORT || 5000;
const MONGO  = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/amic-suggestions';
const SECRET = process.env.SESSION_SECRET || 'amic-suggestions-secret';

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Limit request body size (prevent large payload attacks)
app.use(express.json({ limit: '50kb' }));

// CORS — restrict to your internal network only
app.use(cors({ origin: /^http:\/\/10\.203\.3\.\d+/, credentials: true }));

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // max 10 login attempts per 15 min per IP
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 submissions per hour per IP
  message: { error: 'Too many submissions, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO }),
  cookie: { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 1000 * 60 * 60 * 8 },
}));

app.use('/api/auth/login', loginLimiter);
app.use('/api/suggestions', (req, res, next) => {
  if (req.method === 'POST') return submitLimiter(req, res, next);
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/suggestions', require('./routes/suggestions'));

// Serve React build in production
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

async function seedAdmin() {
  const User = require('./models/User');
  const exists = await User.findOne({ username: 'admin' });
  if (!exists) {
    await User.create({ username: 'admin', password: 'Admin@1234' });
    console.log('Default admin created — username: admin / password: Admin@1234');
  }
}

mongoose.connect(MONGO)
  .then(async () => {
    console.log('MongoDB connected to:', MONGO);
    await seedAdmin();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB error:', err));
