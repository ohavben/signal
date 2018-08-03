'use strict';
const mongoose = require('mongoose');
const domains = mongoose.Schema({_id: mongoose.Schema.Types.ObjectId, domain:{ type: String, required: true } });
 
module.exports = mongoose.model('domains', domains)