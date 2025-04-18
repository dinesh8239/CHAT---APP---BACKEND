const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { Schema } = mongoose
const jwt = require('jsonwebtoken');

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        index: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },

    password: {
        type: String,
        required: true
    },

    avatar: {
        type: String,
        required: true
    },

    refreshToken: {
        type: String,
        required: false
    },

    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String
    },

    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },

}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {

    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        userName: this.userName,

    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}

const User = mongoose.model('User', userSchema)

module.exports = User