'use strict';
const mongoose = require('mongoose');
const users = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userName:{
        type: String,
        required: true
    },
    avatar: String,
    peerID: String,
    socket: String
});
 
module.exports = mongoose.model('users', users)