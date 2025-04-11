const mongoose = require('mongoose')
const { Schema } = mongoose

const notificationSchema = new Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    },

    message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },

    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification