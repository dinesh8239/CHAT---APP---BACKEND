const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/multer.middleware.js");
const { register, login, verifyEmail } = require('../controllers/authController.js');
const { forgotPassword } = require("../controllers/authController");
const { resetPassword } = require("../controllers/authController");


// POST /api/auth/register
router.post(
  "/register",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  register
);

// POST /api/auth/login
router.post("/login", login);

// GET route for email verification
router.route('/verify-email').get(verifyEmail);

router.route("/forgot-password").post(forgotPassword);

router.route("/reset-password").post(resetPassword);



module.exports = router;
