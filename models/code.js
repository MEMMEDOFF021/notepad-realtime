const mongoose = require('mongoose');

// Mongoose modelini yarat
const codeSchema = new mongoose.Schema({
  content: String,  // Kodun məzmunu
  createdAt: {
    type: Date,
    default: Date.now, // Yaradılma vaxtı
  },
});

const Code = mongoose.model('Code', codeSchema);

module.exports = Code;
