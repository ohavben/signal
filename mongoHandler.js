'use strict';
const mongoose = require('mongoose');
const chats = require('./chat_schema.js');
const users = require('./user_schema.js');
const options = { useNewUrlParser: true, bufferCommands: false };
const host = 'mongodb://localhost:27017/';

const dbCommands = {

    init:(domain) =>  new Promise((resolve, reject) =>

        mongoose.connect(`${host}${domain}`, options)
        .then(() => mongoose.connection.db.dropDatabase()
        .then(() => mongoose.connection.close())
        .then(() => resolve(true))
        .catch((err) => reject(Error(err))))),

    create_user: (domain, params) => new Promise((resolve, reject) =>

        mongoose.connect(`${host}${domain}`, options)
        .then(() => {

            let temp_user = new users({
                _id: new mongoose.Types.ObjectId(),
                userName: params.userName,
                socketID: params.socketID,
                peerID: params.peerID,
                avatar: params.avatar
            }) , temp_chat; 

            temp_user.save()
            .then(() => chats.findOne({ title: 'lobby' }).sort('-created'))
            .then((chat) => {

                if (!chat) {
                    temp_chat = new chats({
                        _id: new mongoose.Types.ObjectId(),
                        title: 'lobby',
                        by: 'Carousel',
                        avatar: 'na',
                        users: [mongoose.Types.ObjectId(temp_user._id)]
                    });

                    temp_chat.save()
                    .then(() => mongoose.connection.close())
                    .then(() => resolve({ user:temp_user , chat:temp_chat }))
                    .catch((err) => reject(Error(err)))

                } else {

                    chat.users.push(mongoose.Types.ObjectId(temp_user._id));
                    chat.save()
                    .then(() => mongoose.connection.close())
                    .then(() => resolve({ user:temp_user , chat:chat }))
                    .catch((err) => reject(Error(err)))

                }
            }).catch((err) => reject(Error(err)))  
        }).catch((err) => reject(Error(err)))),

    delete_user: (domain, id) => new Promise((resolve, reject) =>

        mongoose.connect(`${host}${domain}`, options)
        .then(() => users.deleteOne({'_id' : mongoose.Types.ObjectId(id)}))
        .then(() =>  chats.find({ users: mongoose.Types.ObjectId(id) }))
        .then((chats) => { mongoose.connection.close(); return chats })
        .then((chats) => resolve({ deleted: true, chats: chats }))
        .catch((err) => reject(Error(err)))),
    
    search_for_chats: (domain, params) =>  new Promise(( resolve, reject) => 

        mongoose.connect(`${host}${domain}`, options)      
        .then(() => chat.find((params.title) ? { title:params.title }: {}).sort('-created').limit((params.limit)?params.limit:20))
        .then((chats) => mongoose.connection.close())
        .then(() => resolve(chats))
        .catch((err) => reject(Error(err)))),

    get_user: (domain, params) => new Promise(( resolve, reject) => 
    
        mongoose.connect(`${host}${domain}`, options)
        .then(() => user.find(params).sort('-created').limit((params.limit)?params.limit:20))
        .then((users) => mongoose.connection.close())
        .then(() => resolve(users))
        .catch((ERR) => reject(Error(err)))),

    create_Chat: (domain, params) => new Promise(( resolve, reject) =>

        mongoose.connect(`${host}${domain}`, options)

            .then(() => {

                let temp = new chat({
                    _id: new mongoose.Types.ObjectId(),
                    title: params.title,
                    by: params.by,
                    avatar: params.avatar,
                    users: [params.by.userID]
                });

                temp.save()

                .then(() => mongoose.connection.close())
                .then(() => resolve(chat))
                .catch((err) => reject(Error(err)))
            }).catch((err) => reject(Error(err)))),

    delete_chat: (domain, id) =>  new Promise((resolve, reject) => 
    
        mongoose.connect(`${host}${domain}`, options)
        .then(() => chat.deleteOne({ '_id': mongoose.Types.ObjectId(id) }))
        .then((res) => mongoose.connection.close())
        .then(() => resolve(res))
        .catch((err) => reject(Error(err)))),

    join_chat: (domain, chat_id, id) => new Promise((resolve, reject) => 

        mongoose.connect(`${host}${domain}`, options)
        .then(() => chats.findById(chat_id))
        .then((chat) => {
            chat.users.push(mongoose.Types.ObjectId(user_id));
            chat.save()
            .then(() => mongoose.connection.close())
            .then(() => resolve(chat))
            .catch((err) => reject(Error(err)))
        })
        .catch((err) => reject(Error(err)))),

    leave_chat: (domain, chat_id, user_id) => new Promise((resolve, reject) => 

        mongoose.connect(`${host}${domain}`, options)
        .then(() => chats.findById(chat_id))
        .then((chat) => {
            chat.users.pull(mongoose.Types.ObjectId(user_id));
            chat.save()
            .then(() => mongoose.connection.close())
            .then(() => resolve({ left: true , chat:chat }))
            .catch((err) => reject(Error(err)))
        })
        .catch((err) => reject(Error(err)))),

    get_all_chat_users: (domain, id) => new Promise((resolve, reject) => 

        mongoose.connect(`${host}${domain}`, options)
        .then(() =>  chats.findById(chat_id))
        .then((chat)=> mongoose.connection.close())
        .then(() => resolve(chat))
        .catch((err) => reject(Error(err))))
};

module.exports = dbCommands 
