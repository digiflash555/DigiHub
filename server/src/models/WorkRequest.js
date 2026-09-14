const mongoose = require('mongoose');

const workRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterRole: { type: String, enum: ['Faculty', 'Class Coordinator', 'Program Coordinator'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'Assigned', 'Accepted', 'Completed', 'Rejected'], default: 'Pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate: { type: Date },
  workDetails: { type: String },
  experienceFeedback: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WorkRequest', workRequestSchema);
