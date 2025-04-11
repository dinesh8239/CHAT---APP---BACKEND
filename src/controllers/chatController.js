const Chat = require("../models/chat.model.js");
const User = require("../models/user.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

// 1. Create or fetch one-to-one chat
const accessChat = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {

            throw new ApiError(400, "UserId param not sent with request")
        }

        let chat = await Chat.findOne({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        }).populate("users", "-password").populate("latestMessage");

        chat = await User.populate(chat, {
            path: "latestMessage.sender",
            select: "name email",
        });

        if (chat) return res.send(chat);

        const newChatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        const createdChat = await Chat.create(newChatData);
        const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");
        return res.status(200).json(
            new ApiResponse(
                200,
                "Chat created successfully",
                fullChat

            )
        )

    }
    catch (err) {
        console.error(err);
        throw new ApiError(401, "Something went wrong" || err.message)
    }

};

// 2. Fetch all chats for a user
const fetchChats = async (req, res) => {
    try {
        let chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        chats = await User.populate(chats, {
            path: "latestMessage.sender",
            select: "name email",
        });

        // res.status(200).send(chats);
        return res.status(200).json(
            new ApiResponse(
                200,
                "Chats fetched successfully",
                chats

            )
        )
    } catch (err) {
        throw new ApiError(400, "Error fetching chats" || err.message)
    }
}
// 3. Create group chat
const createGroupChat = async (req, res) => {
    try {
        const { users, name } = req.body;

        if (!users || !name)
            throw new ApiError(400, "please fill all the fields")

        let usersList = req.body.users;

        if (usersList.length < 2) {
            throw new ApiError(400, "More than 2 users are required to form a group chat")
        }

        usersList.push(req.user);

        const groupChat = await Chat.create({
            chatName: name,
            users: usersList,
            isGroupChat: true,
            groupAdmin: req.user,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        return res.status(200).json(
            new ApiResponse(
                200,
                "Group chat created successfully",
                fullGroupChat

            )
        )
    } catch (error) {
        throw new ApiError(400, "Error creating group chat" || error.message)
    }
};

// 4. Rename group
const renameGroup = async (req, res) => {
    try {
        const { chatId, chatName } = req.body;

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { chatName },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!updatedChat) {
            // return res.status(404).send("Chat not found");
            // return res.status(404).json({
            //     message: "Chat not found"

            // })
            throw new ApiError(404, "Chat not found")
        } else {
            // res.json(updatedChat);
            return res.status(200).json(
                new ApiResponse(
                    200,
                    "Group renamed successfully",
                    updatedChat
                )
            )
        }
    }
    catch (error) {
       throw new ApiError(400, "Error renaming group" || error.message)
    }
}
// 5. Add or remove user from group
const addToGroup = async (req, res) => {
    try {
        const { chatId, userId } = req.body;
    
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { $push: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");
    
        return res.status(200).json(
            new ApiResponse(
                200,
                "User added to group successfully",
                updatedChat
    
            )
        )
    } catch (error) {
        throw new ApiError(400, "Error adding user to group" || error.message)
        
    }
};

const removeFromGroup = async (req, res) => {
    try {
        const { chatId, userId } = req.body;

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        // res.json(updatedChat);
        return res.status(200).json(
            new ApiResponse(
                200,
                "User removed from group successfully",
                updatedChat
            )
        )
    } catch (error) {
        throw new ApiError(400, "Error removing user from group", error.message)
    }
};

module.exports = {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
};
