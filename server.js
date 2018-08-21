'use strict';

//init variables
var questions = [];
var question1 = { question: "In welk jaar werd de Zuiderzee afgesloten en noemde men het onstane water, het IJsselmeer?", A: "1870", B: "1916", C: "1932", D: "1945", Correct: "C" }
var question2 = { question: "Waar heeft Flevoland zijn naam aan te danken?", A: "Bij de watersnoodramp van 1916 kwam de familie Flevo om", B: "Johan Flevo (1785-1837) was een pionier op het gebied van drooglegging", C: "De Romeinen noemden het meer dat destijds op die plek lag het Flevomeer", D: "Flevo betekent in het Latijn 'vloed'", Correct: "D" }
var question3 = { question: "Waarom is Flevoland omgeven door een strook water?", A: "De grond van de omliggende provincies is te zacht", B: "Anders kregen omliggende provincies grondwaterproblemen", C: "Het tussengelegen water dient ter verkoeling voor de toeristen", D: "Ter afbakening van de provinciegrenzen", Correct: "B" }
questions.push(question1);
questions.push(question2);
questions.push(question3);
var questionselected = 1;

var gamestate = "start"; // start, waiting, question, questionresult, end
var totalplayer = 0;

var app = require('express')();
var path = require('path');
var port = process.env.PORT || 1337;
var fs = require('fs');
var server = require('http').createServer(function (req, res) {
    fs.readFile('index.html', function (err, data) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(data);
        res.end();
    });
});

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

var io = require('socket.io')(server);


var clients = 0;
var users = [];

io.on('connection', function (socket) {
    console.log('A user connected');

    socket.on('setUsername', function (username) {
        socket.username = username;

        console.log(socket.username);

        if (users.indexOf(socket.username) > -1) {
            socket.emit('userExists', username + ' naam bestaat al! Probeer een andere naam.');
        } else {
            users.push(socket.username);
            clients++;
            if (socket.username == 'admin') {
                socket.emit('setScreenType', { type: 'admin' })
            }
            else {
                socket.emit('setScreenType', { type: 'player' })
            }

            socket.emit('userSet', { username: socket.username });
            socket.emit('welkommsg', { message: 'Welkom!', username: socket.username });
            socket.broadcast.emit('clientconnectmsg', { message: (socket.username + ' doet ook mee!') });
        }

        socket.on('disconnect', function () {
            clients--;

            var index = users.indexOf(socket.username);

            if (index != -1) {

                users.splice(index, 1);
            }

            console.log(socket.username + ' disconnected.');
            socket.broadcast.emit('clientconnectmsg', { message: (socket.username + ' is gestopt met het spel!') });
        });
    });

    socket.on('msg', function (data) {
        //Send message to everyone
        console.log(data);
        io.sockets.emit('newmsg', data);
    })
});