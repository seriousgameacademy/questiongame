'use strict';
var http = require('http');
var port = process.env.PORT || 1337;

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(port);




var app = require('express')();
//var http = require('http').Server(app);
//var port = process.env.PORT || 1337;
//var io = require('socket.io')(http);

//app.get('/', function (req, res) {
//    res.sendfile('index.html');
//});

//var clients = 0;
//var users = [];

////io.on('connection', function (socket) {
////    console.log('A user connected');

////    socket.on('setUsername', function (username) {
////        socket.username = username;

////        console.log(socket.username);

////        if (users.indexOf(socket.username) > -1) {
////            socket.emit('userExists', username + ' naam bestaat al! Probeer een andere naam.');
////        } else {
////            users.push(socket.username);
////            clients++;
////            socket.emit('userSet', { username: socket.username });
////            socket.emit('welkommsg', { message: ('Welkom ' + socket.username + '!') });
////            socket.broadcast.emit('clientconnectmsg', { message: (socket.username + ' doet ook mee!') });

////        }

////        socket.on('disconnect', function () {
////            clients--;

////            var index = users.indexOf(socket.username);

////            if (index != -1) {

////                users.splice(index, 1);
////            }

////            socket.broadcast.emit('clientconnectmsg', { message: (socket.username + ' is gestopt met het spel!') });
////        });
////    });

////    socket.on('msg', function (data) {
////        //Send message to everyone
////        console.log(data);
////        io.sockets.emit('newmsg', data);
////    })
////});

//http.listen(port, function () {
//    console.log('listening on localhost:' + port);
//});
