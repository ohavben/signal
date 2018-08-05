'use strict';
const App = require('./mongoHandler.js');
const WebSocket = require('ws').Server;
const wss = new WebSocket({ port: 4000 });
const connections = {};
console.log('carousel app started')

App.init('Carousel')
    .then((res) => console.log(`db intitated: ${res}`))
    .catch((err) => console.log(`db Not initiated: ${err}`))

wss.on('connection', (ws, req) => {

    let domain = (req.headers.host == 'localhost:4000') ? 'Carousel' : req.headers.host;
    if (!originIsAllowed(domain)) ws.terminate();

    App.create_user(domain, { userName: 'Ohav' })
    .then((res) => {
        console.log(`created user: ${res.user._id} and joind chat ${res.chat._id} / ${Object.keys(connections).length }`)

        ws.user_id = res.user._id;
        ws.userName = res.user.userName;
        connections[res.user._id] = ws;

        ws.send(JSON.stringify({
            type:'registration successful',
            user_id: res.user._id,
            chat: res.chat
        }));

        return broadcast(JSON.stringify({
            type:'new user joined',
            user:res.user
        }) , res.chat.users , res.user._id)

    }).catch((err) => console.log(`user not created` , err))
 

    ws.on('disconnect', () => {
        delete connections[ws.user_id];
        console.log(`user ${ws.user_id} left ${Object.keys(connections).length } users left`)

        App.delete_user(domain, ws.user_id)
        .then((response) => response.chats.forEach((chat) => 
            App.leave_chat(domain, chat._id, ws.user_id)
            .then((response) => broadcast(JSON.stringify({ 
                type: 'user left',
                id: ws.user_id, 
                userName: ws.userName
            }) , response.chat.users , ws.user_id))
            .catch((err) => console.log('ERROR: user didnt leave chat ' , err))))
        .catch((err)=> console.log('user not deleted:' , err))
    });

    ws.on('close', (reasonCodews, description) => {
        delete connections[ws.user_id];
        console.log(`user ${ws.user_id} left ${Object.keys(connections).length } users left`)

        App.delete_user(domain, ws.user_id)
        .then((response) => response.chats.forEach((chat) => 
            App.leave_chat(domain, chat._id, ws.user_id)
            .then((response) => broadcast(JSON.stringify({ 
                type: 'user left',
                id: ws.user_id, 
                userName: ws.userName
            }) , response.chat.users , ws.user_id))
            .catch((err) => console.log('ERROR: user didnt leave chat ' , err))))
        .catch((err)=> console.log('user not deleted:' , err))
    });

    ws.on('message', (message) => {
        let data = ''//JSON.parse(message);
        //console.log(data.type)
        switch(data.type){

            case 'search for chats': 
            return App.search_for_chats(domain, title).then((chats) => {
                return connections[ws.user_id].send(JSON.stringify({
                    type:'search for chats',
                    data: chats
                }))
            }).catch((err)=>console.log('Error: ',err));

            case 'new text message': 
            return App.get_all_chat_users(domain, chat_id).then((users)=>{
                return connections[ws.user_id].send(JSON.stringify({
                    type:'search for chats',
                    data: chats
                }))
            }).catch((err)=>console.log('Error: ',err));

            case 'crate new chat': return App.create_Chat(domain, params).then((res)=>{
                    
            }).catch((err)=>console.log('Error: ',err));

            case 'delete chat': return App.create_Chat(domain, chat_id).then((res)=>{
                    
            }).catch((err)=>console.log('Error: ',err));

            case 'join chat': 
            return App.join_chat(domain, chat._id, ws.user_id)
                .then((response) => broadcast(JSON.stringify({ 
                    type: 'user joined',
                    id: ws.user_id, 
                    userName: ws.userName
                }) , response.chat.users , ws.user_id))
                .catch((err) => console.log('ERROR: user didnt join chat ' , err))

            case 'leave chat': 
            return App.leave_chat(domain, chat._id, ws.user_id)
                .then((response) => broadcast(JSON.stringify({ 
                    type: 'user left',
                    id: ws.user_id, 
                    userName: ws.userName
                }) , response.chat.users , ws.user_id))
                .catch((err) => console.log('ERROR: user didnt leave chat ' , err))

            case 'private chat invite': return App.private_chat_invite(domain, chat_id).then((res)=>{
                    
            }).catch((err)=>console.log('Error: ',err));

            case 'private_chat_accepted': return App.private_chat_response(domain, chat_id).then((res)=>{
                    
            }).catch((err)=>console.log('Error: ',err));

            default: return
        }
    })
});

function broadcast(message , to , by){
    return to.filter((id) => id !== by).forEach((user) => 
        (connections[user].readyState == 1) ? 
            connections[user].send(message) : 
            console.log(`broadcasting to ${connections[user]._id} failed .socket disconnected`));
}


/* ******************************************************* */

function originIsAllowed(origin) {
    let allowed_connections = ['localhost:4000','Carousel']
    if (allowed_connections.includes(origin)) return true
    return false;
}
