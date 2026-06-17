require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT   = process.env.PORT || 5000;
const MONGO  = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/amic-suggestions';
const SECRET = process.env.SESSION_SECRET || 'amic-suggestions-secret';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO }),
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 },
}));

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
