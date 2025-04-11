const fs = require('fs');
const uploadOnCloudinary = require('../utils/cloudinary.js')
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js')
const User = require('../models/user.model.js')
const ApiResponse = require('../utils/ApiResponse.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const validateSchemaUpdatae = require('../utils/validation.js')
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// const mongoose = require ('mongoose')


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        console.log('Access Token Secret:', process.env.ACCESS_TOKEN_SECRET);
        console.log('Refresh Token Secret:', process.env.REFRESH_TOKEN_SECRET);

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.
        refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            server: true
        }

        const { accessToken, newRefreshToken } = await
            generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message ||
            "something went wrong")
    }
})

const register = asyncHandler(async (req, res) => {
    try {
        validateSchemaUpdatae(req);

        const { userName, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(400, "User with this email already exists");
        }

        const avatarBuffer = req.files?.avatar?.[0]?.buffer;

        if (!avatarBuffer) {
            throw new ApiError(400, "Avatar file is required");
        }

        const fileSizeInMB = avatarBuffer.length / (1024 * 1024);
        if (fileSizeInMB > 30) {
            throw new ApiError(400, "File size exceeds the maximum allowed size of 5MB.");
        }

        const avatar = await uploadOnCloudinary(avatarBuffer);

        if (!avatar) {
            throw new ApiError(400, "Failed to upload avatar to Cloudinary");
        }


        const verificationToken = crypto.randomBytes(32).toString('hex');

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        await sendEmail(email, 'Verify Your Email', `
        <h3>Welcome to Chat App!</h3>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `);

        const newUser = await User.create({
            userName,
            email,
            password,
            avatar: avatar.secure_url,
            verificationToken
        });

        const createdUser = await User.findById(newUser._id)
            .select("-password -refreshToken")
            .lean();

        if (!createdUser) {
            throw new ApiError(400, "User not created");
        }

        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered successfully")
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong");
    }
});

const login = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body
        console.log("Email:", email);
        console.log("Password:", password);

        console.log(req.body)

        if (!(email || password)) {
            throw new ApiError(400, "email and password are required")
        }

        const user = await User.findOne({
            $or: [{ email: email }, { userName: email }]
        })

        // console.log("Retrieved User:", user);

        if (!user) {
            throw new ApiError(401, "Invalid credentials")
        }

        // console.log("Hashed Password in DB:", user.password);

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        // console.log("Plain Password:", password);
        // console.log("Hashed Password in DB:", user.password);
        // console.log("Is Password Correct:", isPasswordCorrect);

        if (!isPasswordCorrect) {
            throw new ApiError(401, "Invalid credentials")
        }


        // console.log('Access Token Secret:', process.env.ACCESS_TOKEN_SECRET);
        // console.log('Refresh Token Secret:', process.env.REFRESH_TOKEN_SECRET);



        const { accessToken, refreshToken } = await
            generateAccessAndRefreshTokens(user._id)

        const loggedInUser = await User.findById(user._id).
            select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, {

                    user: loggedInUser, accessToken, refreshToken
                },
                    "User logged In Successfully"
                )
            )


    } catch (error) {
        console.log("Error:", error);
        throw new ApiError(401, error?.message || "something went wrong")
    }


})

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
        throw new ApiError(400, "Invalid or expired token");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.status(200).json(new ApiResponse(200, user, "Email verified successfully"));
});


const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found with this email");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 mins

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
        email,
        "Reset Your Password",
        `
          <h3>Hello ${user.userName},</h3>
          <p>Click below link to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 30 minutes.</p>
          `
    );

    return res.status(200).json(
        new ApiResponse(200, user, "Password reset email sent successfully")
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
        throw new ApiError(400, "Token and new password are required");
    }

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // Check if token not expired
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired token");
    }

    user.password = newPassword; // This will get encrypted before save
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json(new ApiResponse(200, user, "Password reset successfully"));
});


module.exports = {
    refreshAccessToken,
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword
};

