'use strict';
const mongoose = require('mongoose');
const chats = new mongoose.Schema({

    _id: mongoose.Schema.Types.ObjectId,
    title: {
        type: String,
        required: true
    },
    by: {
        type: String,
        required: true
    },
    avatar: String,
    created: {
        type: Date,
        default: Date.now
    },
    users: {
        type: Array,
        required: true
    }
});

module.exports = mongoose.model('chats', chats);