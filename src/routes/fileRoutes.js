const express = require('express');
const router = express.Router();
const { upload, uploadToCloudinary } = require('../middlewares/multer.middleware.js');

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const result = await uploadToCloudinary(req.file.buffer, 'chat_app_uploads');
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

module.exports = router;
