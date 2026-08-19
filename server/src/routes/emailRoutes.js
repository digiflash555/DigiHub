const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const emailController = require('../controllers/emailController');

router.use(protect, authorize('Admin')); // All email routes are Admin only

// Config
router.get('/config', emailController.getConfig);
router.post('/config', emailController.saveConfig);
router.post('/test', emailController.testConfig);

// Events & recipient resolution
router.get('/events', emailController.getEvents);
router.get('/event-recipients/:eventId', emailController.getEventRecipients);

// Templates
router.get('/templates', emailController.getTemplates);
router.put('/templates/:id', emailController.updateTemplate);
router.delete('/templates/:id', emailController.deleteTemplate);
router.post('/templates/:id/restore', emailController.restoreDefaultTemplate);

// Manual & Drafts
router.get('/recipient-groups', emailController.getRecipientGroups);
router.post('/send', emailController.sendManualEmail);
router.get('/drafts', emailController.getDrafts);
router.post('/drafts', emailController.saveDraft);
router.delete('/drafts/:id', emailController.deleteDraft);

// Scheduled
router.get('/scheduled', emailController.getScheduledEmails);
router.delete('/scheduled/:id', emailController.deleteScheduledEmail);

// History & Stats
router.get('/history', emailController.getHistory);
router.get('/stats', emailController.getStats);

module.exports = router;
