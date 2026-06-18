const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  employeeName: { type: String, default: '' },
  employeeId:   { type: String, default: '' },
  department:   { type: String, default: '' },
  category:     { type: String, default: '' },
  title:        { type: String, required: true },
  description:  { type: String, required: true },
  status:       { type: String, enum: ['Pending', 'Under Review', 'Implemented', 'Rejected'], default: 'Pending' },
  adminNote:    { type: String, default: '' },
  submittedAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
