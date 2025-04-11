const express = require("express");

const router = express.Router();

const { sendMessage, allMessages } = require("../controllers/messageController.js");
const verifyJWT = require("../middlewares/auth.middleware.js");

// Route to send a message
router.route("/").post(verifyJWT, sendMessage);

// Route to get all messages of a chat
router.route("/:chatId").get(verifyJWT, allMessages);

module.exports = router;
