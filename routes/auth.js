const express = require('express')
const route = express.Router()

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')
const User = require('../model/user')
require('dotenv').config()

const crypto = require('crypto')
const sendOTP = require('../utils/nodemailer')



// endpoint for user to sign-up
route.post('./signup', async (req, res) => {

    // request the name , email and password from the body
    const { name, email, password } = req.body;

    try {
        // Check if the required fiiled is missing
        if (!name || !password || !email) {
            return res.status(400).send({ status: 'Please fill in all required fields' });
        }

        // Check if the user email already exist 
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).send({ status: 'User email already exists' });
        }

        // hash the user password
        const hashPassword = await bcrypt.hash(password, 10);

        // create new user with the details collected
        const newUser = new User()
        newUser.name = name
        newUser.email = email
        newUser.password = hashPassword

        // save the new user in the database
        await newUser.save()

        // send the sccesss and the details to the client
        res.status(200).status({ status: 'User Created Successfully', user: newUser })
    }
    catch (error) {
        console.error('Error Creating user' + error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
})

// endpoint for user to login 
route.post('/login', async (req, res) => {
    // request the name , email and password from the body
    const { email, password } = req.body

    try {
        // CHeck if the username or password filed are empty 
        if (!email || !password) {
            return res.status(400).send({ status: 'Please fill in all required fields' });
        }

        // checl if users exist 
        const user = await User.findOne({ email })

        // if user not found, return error
        if (!user) {
            return res.status(400).send({ status: 'User not found' });
        }

        // to compare the password passed by the user vs the password in the database
        const cPassword = await bcrypt.compare(password, user.password)

        //  if password not same after bcrytping it return Incorrect password
        if (!cPassword) {
            return res.status(401).send({ status: 'Incorrect details' });
        }

        // generatejwt token
        const token = jwt.sign({
            _id: user._id,
        }, process.env.JWT_TOKEN_PASS)

        // update user
        await user.save();
        res.status(200).send({ status: 'Login successful', user, token })
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
})

// endpoint when the user forgets password
route.post('/forget-password', async (req, res) => {
    const { email } = req.body  // destructioning the request body

    try {
        if (!email) {
            return res.status(400).send({ 'status': 'Error', 'msg': 'all fields must be filled' });
        }
        // find the user in the databse
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).send('User with this email does not exist.');
        }

        // generate a otp number with crypto js
        const otp = crypto.randomInt(10000, 999999).toString()

        // update the user otp field
        user.otp = otp;
        user.otpTime = Date.now() + 5 * 60 * 1000 // 5 minute for the otp to expire
        sendOTP(email, otp)

        return res.status(200).send({ status: 'ok', msg: 'otp send succesfully to ' + email }); ``
    }
    catch (error) {
        console.error(error);
        // Sending error response if something goes wrong
        res.status(500).send({ status: "some error occurred", msg: error.message });
    }
})

//  verify if the otp sent is the same as the otp user wrote
route.post('/verofy-otp', async (req, res) => {
    const { otp } = req.body // destrustioning from the body

    try {
        //  test for ifany of the filed is empty
        if (!otp) {
            return res.status(400).send({ status: 'All fields must be filled' });
        }
        // find the user inthe database with the email
        const user = User.findOne({ otp })
        if (!user) {
            return res.status(400).send({ status: 'Invalid or expired OTP' });
        }

        // when the user otp sent from clienct isnt correct with the otp sent from the server 
        if (user.otp !== otp || user.otpTime < Date.now()) {
            user.otp = null
            user.otpTime = null
            await user.save

            return res.status(400).send({ status: 'Invalid or expired OTP' });
        }

        //  when the otp is correct and not yet expired
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).send({ status: 'OTP verified successfully' });

    }
    catch {
        console.error('Error during OTP verification:', error);
        res.status(500).send({ status: 'Internal Server Error', msg: error.message });

    }
})

// endpoint for resetting password
route.post('/password-reset', async (req, res) => {
    const { email, newPassword, confirmNewPassword } = req.body;  // destructuring the request body

    try {
        // Check if all fields are not empty
        if (!email || !newPassword || !confirmNewPassword) {
            return res.status(400).send({ status: 'Error', msg: 'All fields must be filled' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists in database
        if (!user) {
            return res.status(400).send({ status: 'User not found' });
        }

        // Compare the new password and the confirm new password
        if (newPassword !== confirmNewPassword) {
            return res.status(400).send({ status: 'Error', msg: 'Passwords do not match' });
        }

        // Hash the new password
        const hashPassword = await bcrypt.hash(newPassword, 10);

        // Update user password in the database
        user.password = hashPassword;

        await user.save();
        res.status(200).send({ status: 'Password reset successfully' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).send({ status: 'Internal Server Error', msg: error.message });
    }
});

module.exports = route