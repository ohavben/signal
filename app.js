'use strict';
const mongo = require('./mongo command.js');
const WebSocket = require('ws').Server;
const wss = new WebSocket({ port: 4000 });
const connections = {};
console.log('carousel app started')

wss.on('connection', (ws, req) => {

    let domain = (req.headers.host == 'localhost:4000') ? 'Carousel' : req.headers.host;
    if (!originIsAllowed(domain)) ws.terminate();
 
    mongo.create_user(domain, { userName: 'Ohav' })
    .then((res) => {
        ws.user_id = res._id;
        ws.userName = res.userName;
        connections[res._id] = ws;
        mongo.initiate_db(domain, res._id)
        .then((res)=>{
            console.log(`user: ${res.user} joind chat ${res.chat._id}`)
            let message_to_broadcast = { type:'new user join chat' , data: res.chat.userName }
            let message_to_new_user = { type: 'new chat' , data: res.chat}
            ws.send(JSON.stringify(message_to_new_user))
            return broadcast(message_to_broadcast , res.chat.users , ws.user_id)
        }).catch((err)=> console.log(err))
    })
    .catch((err)=> console.log('user not created ' , err));

    ws.on('disconnect', () => {
        mongo.delete_user(domain, ws.user_id)
        .then((res) => {
            console.log(`user ${ws.user_id} deleted `)
            res.forEach(chat => {
                mongo.leave_chat(domain, chat._id, ws.user_id)
                .then((res)=>{
                    let message = { type: `user_left_the_chat`, userName: connections[ws.user_id].userName };
                    delete connections[ws.user_id];
                    return broadcast(message, res.users , ws.user_id) 
                })
                .catch((err)=> console.log(`ERROR: user ${ws.user_id} NOT purged from chat ${chat._id}  ` , err ))
            });
        })
        .catch((err)=> console.log('user not deleted:' , err))
    });

    ws.on('close', (reasonCode, description) => {
        mongo.delete_user(domain, ws.user_id)
        .then((res) => {
            console.log(`user ${ws.user_id} deleted `)
            res.forEach(chat => {
                mongo.leave_chat(domain, chat._id, ws.user_id)
                .then((res)=>{
                    let message = { type: `user_left_the_chat`, userName: connections[ws.user_id].userName };
                    delete connections[ws.user_id];
                    return broadcast(message, res.users , ws.user_id) 
                })
                .catch((err)=> console.log(`ERROR: user ${ws.user_id} NOT purged from chat ${chat._id}  ` , err ))
            });
        })
        .catch((err)=> console.log('user not deleted:' , err))
    });

    ws.on('message', (message) => {
        let data = ''//JSON.parse(message);
        //console.log(data.type)
        switch(data.type){

            case 'register_user': return ;

            case 'join_public_chat': return ;

            case 'leave_chat': return ;

            case 'search_for_chats': return ;

            case 'new_text_message': return ;

            case 'request_public_chat': return;

            case 'request_private_chat': return;

            case 'accept_private_chat': return;

            default: return
        }
    });
});

function broadcast(message , to , by){
    return to.forEach((user) => {
        if(!connections[user] || connections[user].user_id == by) return 
        return connections[user].send(JSON.stringify(message))
    })
}


/* ******************************************************* */

function originIsAllowed(origin) {
    let allowed_connections = ['localhost:4000','Carousel']
    if (allowed_connections.includes(origin)) return true
    return false;
}