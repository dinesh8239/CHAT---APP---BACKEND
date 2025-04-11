const asyncHandler = require('../utils/asyncHandler.js');
const Notification = require('../models/notification.model.js');
const ApiResponse = require('../utils/ApiResponse.js');
const ApiError = require('../utils/ApiError.js');

// Create a new notification
const createNotification = asyncHandler(async (req, res) => {
    try {
        const { receiverId, chatId, messageId } = req.body;
        const senderId = req.user._id;

        const notification = await Notification.create({
            sender: senderId,
            receiver: receiverId,
            chat: chatId,
            message: messageId,
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                "Notification created successfully",
                notification

            )
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")
    }
}

);

// Get all notifications for a user
const getNotifications = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ receiver: userId })
            .populate('sender', 'userName avatar')
            .populate('chat')
            .populate('message')
            .sort({ createdAt: -1 });

        return res.status(200).json(
            new ApiResponse(
                "Notifications fetched successfully",
                notifications

            )
        )
    }
    catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")
    }
}
);

// Mark a notification as read
const markAsRead = asyncHandler(async (req, res) => {
    try {
        const { notificationId } = req.params;

        const updated = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });

        return res.status(200).json(
            new ApiResponse(
                200,
                "Notification marked as read successfully",
                updated

            )
        )
    }
    catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong")
    }
}
);

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
};
