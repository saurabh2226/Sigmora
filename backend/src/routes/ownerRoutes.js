const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');
const {
  getOwnerDashboard,
  getCommunityThreads,
  createCommunityThread,
  replyToCommunityThread,
  getMonthlyBookingReport,
} = require('../controllers/ownerController');
const { getOwnerBookings, updateBookingStatus } = require('../controllers/bookingController');

router.use(auth);

router.get('/dashboard', allowRoles('admin'), getOwnerDashboard);
router.get('/bookings', allowRoles('admin'), getOwnerBookings);
router.put('/bookings/:id/status', allowRoles('admin'), updateBookingStatus);
router.get('/reports/monthly', allowRoles('admin'), getMonthlyBookingReport);
router.get('/community', allowRoles('admin'), getCommunityThreads);
router.post('/community', allowRoles('admin'), createCommunityThread);
router.post('/community/:id/replies', allowRoles('admin'), replyToCommunityThread);

module.exports = router;
