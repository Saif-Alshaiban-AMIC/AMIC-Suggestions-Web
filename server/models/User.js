const bcrypt = require('bcryptjs');
const { db } = require('../firebase');

const users = db.collection('users');

// Mongoose-free data access for the `users` collection.
const User = {
  async findByUsername(username) {
    const snap = await users.where('username', '==', username).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { _id: doc.id, ...doc.data() };
  },

  async count() {
    const snap = await users.count().get();
    return snap.data().count;
  },

  async create({ username, password }) {
    const hash = await bcrypt.hash(password, 10);
    const ref = await users.add({ username, password: hash });
    return { _id: ref.id, username };
  },

  comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = User;
