const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    otp: String,
    otpTime: Date
}, {collection: 'user'})

module.exports = mongoose.model('user', userSchema)