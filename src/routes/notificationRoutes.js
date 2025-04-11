const express = require('express');
const router = express.Router();
const verifyJWT = require('../middlewares/auth.middleware.js');
const {
  createNotification,
  getNotifications,
  markAsRead,
} = require('../controllers/notificationController.js');

// Protected routes
router.route('/').post(verifyJWT, createNotification);
router.route('/').get(verifyJWT, getNotifications);
router.route('/:notificationId/read').put(verifyJWT, markAsRead);

module.exports = router;
