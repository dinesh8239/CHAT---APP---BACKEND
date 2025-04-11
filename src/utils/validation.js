const ApiError = require('../utils/ApiError.js')

const validateSchemaUpdatae = (req) => {

    const { userName, email, password } = req.body

    if (!userName || !email || !password) {
        throw new ApiError(400, "All fields are required")
    }

    else if (!userName && userName.length < 10 || userName.length > 20) {
        throw new ApiError(400, "Username must be between 10 to 20 characaters")
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format")
    }

    else if (!password || password.length < 8) {
        throw new ApiError(400, "password must be at least 8 characters")
    }
}

module.exports = validateSchemaUpdatae