// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} = require('../controllers/chatController.js');

const verifyJWT = require('../middlewares/auth.middleware.js'); 

// Apply middleware to routes
router.route('/access').post(verifyJWT, accessChat);
router.route('/fetch').get(verifyJWT, fetchChats);
router.route('/group').post(verifyJWT, createGroupChat);
router.route('/group/rename').put(verifyJWT, renameGroup);
router.route('/group/add').put(verifyJWT, addToGroup);
router.route('/group/remove').put(verifyJWT, removeFromGroup);

module.exports = router;
