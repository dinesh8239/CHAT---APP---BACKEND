const ApiResponse = require('../utils/ApiResponse.js');
const ApiError = require('../utils/ApiError.js');
const asyncHandler = require('../utils/asyncHandler.js');

const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    return res.status(200).json(
        new ApiResponse(200, "File uploaded successfully", {
            fileName: req.file.filename,
            path: req.file.path,
        })
    );
});

module.exports = { uploadFile };
