const { db } = require('../firebase');

const suggestions = db.collection('suggestions');

const ALLOWED_STATUS = ['Pending', 'Under Review', 'Implemented', 'Rejected'];

function toObject(doc) {
  return { _id: doc.id, ...doc.data() };
}

// Mongoose-free data access for the `suggestions` collection.
// submittedAt is stored as an ISO string so it sorts correctly and the client
// can parse it with dayjs unchanged.
const Suggestion = {
  async create({ employeeName, employeeId, department, category, title, description }) {
    const data = {
      employeeName: employeeName || '',
      employeeId:   employeeId   || '',
      department:   department    || '',
      category:     category      || '',
      title,
      description,
      status:       'Pending',
      adminNote:    '',
      submittedAt:  new Date().toISOString(),
    };
    const ref = await suggestions.add(data);
    return { _id: ref.id, ...data };
  },

  async findAll(limit = 5000) {
    const snap = await suggestions.orderBy('submittedAt', 'desc').limit(limit).get();
    return snap.docs.map(toObject);
  },

  async updateById(id, { status, adminNote }) {
    const ref = suggestions.doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;

    const update = {};
    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) return null;
      update.status = status;
    }
    if (adminNote !== undefined) update.adminNote = adminNote;

    await ref.update(update);
    const fresh = await ref.get();
    return toObject(fresh);
  },

  async deleteById(id) {
    await suggestions.doc(id).delete();
  },

  async deleteMany(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const batch = db.batch();
    ids.forEach(id => batch.delete(suggestions.doc(id)));
    await batch.commit();
  },
};

module.exports = Suggestion;
