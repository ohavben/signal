'use strict';
const mongoose = require('mongoose');
const chats = require('./chat_schema.js');
const users = require('./user_schema.js');

const dbCommands = {

    initiate_db: (name, user_id) => {
        return new Promise((resolve, reject) => {
        mongoose.connect(`mongodb://localhost:27017/${name}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                chats.findOne({ title: 'lobby' }).sort('-created').limit(1)
                .then((chat) => { 
                    if (!chat){
                        let temp = new chats({
                            _id: new mongoose.Types.ObjectId(),
                            title: 'lobby',
                            by: 'Carousel',
                            avatar: 'na',
                            users: [mongoose.Types.ObjectId(user_id)]
                        });
                        temp.save()
                            .then(() => resolve({ user: user_id, chat: temp}))
                            .catch((err) => reject(Error(err)));
                    } else {
                        chat.users.push(mongoose.Types.ObjectId(user_id));
                        chat.save()
                        .then((res) => resolve({ user: user_id, chat: res}))
                        .catch((err) => reject(Error(err)))
                    }
                })
                .catch((err) => reject(Error(err)))
            }).catch((err) => reject(Error(err)))
        });
    },

    get_chat: (domain, params) => {
        return new Promise(function (resolve, reject) {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                chat.find(params).sort('-created').limit(params.limit).exec((err, chats) => {
                    if (err) reject(Error(err));
                    else resolve(chats);
                });
            }).catch((err) => console.log(err));
        });
    },

    get_user: (domain, params) => {
        return new Promise(function (resolve, reject) {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                user.find(params).sort('-created').limit(params.limit).exec((err, users) => {
                    if (err) reject(Error(err));
                    else resolve(users);
                });
            }).catch((err) => console.log(err));
        });
    },

    create_Chat: (domain, params) => {
        return new Promise(function (resolve, reject) {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                let temp = new chat({
                    _id: new mongoose.Types.ObjectId(),
                    title: params.title,
                    by: params.by,
                    avatar: params.avatar,
                    users: [params.by.userID]
                });
                temp.save((err) => {
                    if (err) reject(Error(err));
                    else resolve(temp);
                });
            }).catch((err) => console.log(err));
        });
    },

    delete_chat: (domain, id) => {
        //console.log(`trying to delete chat ${id}`)
        return new Promise((resolve, reject) => {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                try {
                    chat.deleteOne({ '_id': mongoose.Types.ObjectId(id) })
                        .then((res) => {
                            //console.log(`chat id : ${id} deleted. `, res)
                            resolve(true);
                        })
                        .catch((err) => reject(false));
                } catch (err) { console.log('could not delete chat id: ', id, ' error: ', err) }
            }).catch((err) => console.log('could not delete chat id: ', id, ' error: ', err));
        });
    },

    create_user: (domain, params) => {
        return new Promise(function (resolve, reject) {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                let temp = new users({
                    _id: new mongoose.Types.ObjectId(),
                    userName: params.userName,
                    socketID: params.socketID,
                    peerID: params.peerID,
                    avatar: params.avatar
                });
                temp.save((err) => {
                    if (err) reject(Error(err));
                    else resolve(temp);
                });
            }).catch((err) => console.log(err));
        });
    },

    delete_user: (domain, id) => {
        //console.log(`trying to delete user ${id}`)
        return new Promise((resolve, reject) => {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                
                try {

                    users.deleteOne({'_id' : mongoose.Types.ObjectId(id)})
                    .catch((err) => reject({domain: domain, id:id}));
                    chats.find({ users: mongoose.Types.ObjectId(id) })
                    .then((chats) => resolve(chats))
                    .catch((err) => reject({domain: domain, id:id, err:err}));

                } catch (err) { console.log('could not delete user id: ', id, ' error: ', err) }
            }).catch((err) => console.log('could not delete user id: ', id, ' error: ', err));
        });
    },

    join_chat: (domain, chat_id, id) => {
        return new Promise((resolve, reject) => {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                chats.findById(chat_id)
                .then((chat) => {
                    chat.users.push(mongoose.Types.ObjectId(user_id));
                    chat.save()
                    .then(() => {
                        resolve(chat)
                    })
                    .catch((err) => reject(Error(err)));
                })
                .catch((err) => reject(Error(err)));
            }).catch((err) => console.log('could not delete user id: ', id, ' error: ', err));
        });
    },

    leave_chat: (domain, chat_id, user_id) => {
        return new Promise((resolve, reject) => {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                chats.findById(chat_id)
                .then((chat) => {
                    chat.users.pull(mongoose.Types.ObjectId(user_id));
                    chat.save()
                    .then(() => {
                        resolve(chat)
                    })
                    .catch((err) => reject(Error(err)));
                })
                .catch((err) => reject(Error(err)));
            }).catch((err) => console.log('could not delete user id: ', id, ' error: ', err));
        });
    },

    get_all_chat_users: (domain, id) => {
        //console.log(`trying to get users from chat ${id}`)
        return new Promise((resolve, reject) => {
            mongoose.connect(`mongodb://localhost:27017/${domain}`, { useNewUrlParser: true, bufferCommands: false })
            .then(() => {
                try {
                    chat.findOne({})//'_id' : mongoose.Types.ObjectId(id)})
                        .populate('users')
                        .then((users) => {
                            //console.log(`users array:  `, users)
                            resolve(users);
                        })
                        .catch((err) => reject(Error(err)));
                } catch (err) { console.log('could not delete chat id: ', id, ' error: ', err) }
            }).catch((err) => console.log('could not delete chat id: ', id, ' error: ', err));
        });
    }
};

module.exports = dbCommands