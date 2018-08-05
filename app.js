'use strict';
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const port = process.argv[2] || 8000;

const server = http.createServer((req, res) => {
   
    const parsedUrl = url.parse(req.url);
    let pathname = `.${parsedUrl.pathname}`;
    const mimeType = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',       
        '.json': 'application/json'
    };

    fs.exists(pathname, (exist) => {
        if(!exist) {
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }
        if (fs.statSync(pathname).isDirectory()) {
            pathname += '/index.html';
        }
        fs.readFile(pathname, (err, data) => {
            if(err){
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            } else {
                const ext = path.parse(pathname).ext;
                res.setHeader('Content-type', mimeType[ext] || 'text/plain' );//'Cache-Control': 'no-cache'
                //res.setHeader('Cache-Control', 'max-age=0');
                res.end(data);
            }
        });
    });
});

server.listen(port, () => {
    console.log((new Date()) +  `Server is listening on port ${port} `);
});

const App = require('./mongoHandler.js');
const WebSocket = require('ws').Server;
const wss = new WebSocket({ server: server });
const sockets = {};
console.log('carousel app started')

App.init('Carousel')
    .then((res) => console.log(`db intitated: ${res}`))
    .catch((err) => console.log(`db Not initiated: ${err}`))

wss.on('connection', (ws, req) => {

    let domain = (req.headers.host == `localhost:${port}`) ? 'Carousel' : req.headers.host;
    if (!originIsAllowed(domain)) ws.terminate();

    App.create_user(domain, { userName: 'Ohav' })
    .then((res) => {
        
        ws.user_id = res.user._id;
        ws.userName = res.user.userName;
        sockets[res.user._id] = ws;

        ws.send(JSON.stringify({
            type:'registration successful',
            user_id: res.user._id,
            chat: res.chat
        }));
        console.log(`new user: ${res.user._id} on ${res.chat._id} / ${Object.keys(sockets).length } `)

        return broadcast(JSON.stringify({
            type:'new user joined',
            user:res.user
        }) , res.chat.users , res.user._id)

    })
    .catch((err) => console.log(`user not created` , err))
 

    ws.on('disconnect', () => {
        delete sockets[ws.user_id];
        console.log(`user ${ws.user_id} left ${Object.keys(sockets).length } users left`)

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
        delete sockets[ws.user_id];
        console.log(`user ${ws.user_id} left ${Object.keys(sockets).length } users left`)

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
            return App.search_for_chats(domain, message.data.search)
                .then((chats) => sockets[ws.user_id].send(JSON.stringify({
                    type:'search for chats',
                    data: chats
                })))
                .catch((err)=>console.log('Error: ',err));

            case 'new text message': 
            return App.get_chat_by_id(domain, message.data.chat_id) 
                .then((chat) => broadcast(JSON.stringify({ 
                    type: 'new text message',
                    msg: message 
                }) , chat.users , message.from.user_id))
                .catch((err)=>console.log('Error: ',err));

            case 'crate new chat': 
            return App.create_Chat(domain, message.data.params)
                .then((chat) => sockets[ws._user.id].send(JSON.stringify({
                    type:'new chat created',
                    chat: chat
                })))
                .catch((err)=>console.log('Error: ',err));

            case 'delete chat': 
            return App.delete_Chat(domain, message.data.chat_id)
                .then((chat)=> {
                    sockets[ws._user.id].send(JSON.stringify({
                        type:'chat deleted',
                        chat: chat.id
                    }));

                    return broadcast(JSON.stringify({ 
                        type: 'chat deleted',
                        msg: chat.id 
                    }) , chat.users , message.from.user_id)
                }).catch((err)=>console.log('Error: ',err));

            case 'join chat': 
            return App.join_chat(domain, message.data.chat._id, ws.user_id)
                .then((response) => broadcast(JSON.stringify({ 
                    type: 'user joined',
                    id: ws.user_id, 
                    userName: ws.userName
                }) , response.chat.users , message.from.user_id))
                .catch((err) => console.log('ERROR: user didnt join chat ' , err))

            case 'leave chat': 
            return App.leave_chat(domain, message.data.chat._id, ws.user_id)
                .then((response) => broadcast(JSON.stringify({ 
                    type: 'user left',
                    id: ws.user_id, 
                    userName: ws.userName
                }) , response.chat.users , message.from.user_id))
                .catch((err) => console.log('ERROR: user didnt leave chat ' , err))

            case 'private chat invite': 
            return App.private_chat_invite(domain, message.data.user_id)
                .then((res)=>{
                        
                })
                .catch((err)=>console.log('Error: ',err));

            case 'private_chat_accepted': 
            return App.private_chat_response(domain, message.data.user_id)
                .then((res)=>{
                        
                })
                .catch((err)=>console.log('Error: ',err));

            default: return
        }
    })
});

function broadcast(message , to , by){
    return to.filter((id) => id !== by).forEach((user) => 
        (sockets[user].readyState == 1) ? 
            sockets[user].send(message) : 
            console.log(`broadcasting to ${sockets[user]._id} failed .socket disconnected`));
}


/* ******************************************************* */

function originIsAllowed(origin) {
    let allowed_sockets = ['localhost:4000','Carousel']
    if (allowed_sockets.includes(origin)) return true
    return false;
}
