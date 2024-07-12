const express = require('express')

const mongoose = require('mongoose')
const port = 5000

const app = express()
const cors = require('cors')
require('dotenv').config();


// mongoose dv sever
mongoose.connect(process.env.MONGODB_URI, {})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));



// connect to server
app.use(express.json())

// give access to connect to our endpoint
app.use(cors())


// gain access to my routes
app.use('auth', require('./routes/auth'))

app.listen(port, (error) => {
    if (!error) {
        console.log('Server running on port ' + port);
    }
    else {
        console.log('Error' + error);
    }

})