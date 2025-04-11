const Message = require("../models/message.model.js");
const Chat = require("../models/chat.model.js");
const User = require("../models/user.model");
const Notification = require("../models/notification.model.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

let io;

const setSocketInstance = (socketIO) => {
  io = socketIO;
};

// Send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    throw new ApiError(400, "Invalid data passed into request");
  }

  const newMessage = await Message.create({
    sender: req.user._id,
    content,
    chat: chatId,
  });

  const populatedMessage = await Message.findById(newMessage._id)
    .populate("sender", "userName avatar")
    .populate({
      path: "chat",
      populate: {
        path: "users",
        select: "userName avatar email",
      },
    });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage._id });

  // Send message to online users only
  const chatUsers = populatedMessage.chat.users;

  chatUsers.forEach((user) => {
    if (user._id.toString() !== req.user._id.toString()) {
      io.to(user._id.toString()).emit("newMessage", populatedMessage);
    }
  });

  // Create notifications
  const notifications = chatUsers
    .filter((user) => user._id.toString() !== req.user._id.toString())
    .map((user) => ({
      chat: chatId,
      sender: req.user._id,
      receiver: user._id,
      message: newMessage._id,
    }));

  await Notification.insertMany(notifications);

  return res.status(201).json(new ApiResponse(201, "Message sent successfully", populatedMessage));
});

// Fetch messages of a chat
const allMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", "userName avatar email")
    .populate("chat");

  return res.status(200).json(new ApiResponse(200, "Messages fetched successfully", messages));
});

module.exports = { sendMessage, allMessages, setSocketInstance };
