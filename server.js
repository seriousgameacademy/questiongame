'use strict';

//init variables

var questionselected = -1;
var gamestate = "start"; // start, waiting, question, questionresult, gameover

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
var users = [];

io.on('connection', function (socket) {
    console.log('A user connected');
    CheckGameState();

    socket.on('setUsername', function (username) {
        if (users.indexOf(username) > -1) {
            socket.emit('userExists', 'Speler ' + username + ' bestaat al! Probeer een andere naam.');
            console.log(users);
        } else {
            socket.username = username;
            users.push(socket.username);
            
            if (socket.username == 'admin') {
                questionselected = -1;
                gamestate = "start";
                socket.emit('setScreenType', { type: 'admin' })
                setAdminStatusMessage('Wachten op spelers...');
                
            }
            else {
                socket.emit('setScreenType', { type: 'player' })
                socket.emit('welkommsg', { message: 'Welkom!', username: socket.username });
                console.log(gamestate);
            }
            
            console.log(users);

            socket.emit('userSet', { username: socket.username });

            if (socket.username != 'admin') {
                var data1 = { message: (socket.username + ' doet ook mee!') };
                console.log(data1);
                io.sockets.emit('clientconnectmsg', data1);
            }

            var totalplayers = users.length - 1; // Do not count admin
            var data2 = { players: totalplayers.toString() };
            console.log(data2);
            io.sockets.emit('totalamountplayers', data2);

            CheckGameState();
        }

        socket.on('disconnect', function () {
            if (socket.username != null && socket.username != "") {
                var index = users.indexOf(socket.username);

                if (index != -1) {

                    users.splice(index, 1);
                }

                console.log(socket.username + ' disconnected.');
            }
            else {
                console.log('User disconnected.');
            }
            
            console.log(users);
        });
    });
    socket.on('msg', function (data) {
        //Send message to everyone
        console.log(data);
        io.sockets.emit('newmsg', data);
    })
    socket.on('getQuestion', function (data) {
        //Send next question to everyone
        var questions = getQuestions();
        var index = questions.length - 1;

        if (index == questionselected) {
            updateGameStateAll('gameover');
            return;
        }

        if (index > questionselected) {
            questionselected++;
        }

        var data = { question: questions[questionselected], questionselected: questionselected }
        console.log(data);
        io.sockets.emit('newquestion', data);

        updateGameStateAll('question');
        setAdminStatusMessage('Weet jij het goede antwoord?...');
    })

    socket.on('getQuestionResult', function (data) {
        getQuestionResult();
    })

    function updateGameStateAll(state) {
        var data = { state: state, username: socket.username };
        io.sockets.emit('setGameState', data);
        gamestate = state;
    }

    function getQuestionResult() {
        var questions = getQuestions();
        var data = { question: questions[questionselected], questionselected: questionselected, answerA: 10, answerB: 55, answerC: 5, answerD: 30 }
        console.log(data);
        io.sockets.emit('setAnswerResult', data);
        updateGameStateAll('answer');
        setAdminStatusMessage('Antwoord ' + questions[questionselected].Correct + ' is het JUISTE antwoord...');
    }

    function CheckGameState() {
        if (gamestate == 'start') {
            updateGameStateSocket('start');
        }
        if (gamestate == 'question') {
            var questions = getQuestions();
            var data = { question: questions[questionselected], questionselected: questionselected }
            console.log(data);
            socket.emit('newquestion', data);
            updateGameStateSocket('question');
        }
        if (gamestate == 'answer') {
            getQuestionResult();
            updateGameStateSocket('answer');
        }
        if (gamestate == 'gameover') {
            updateGameStateSocket('gameover');
        }
    }

    function updateGameStateSocket(gamestate) {
        var data = { state: gamestate, username: socket.username };
        socket.emit('setGameState', data);
    }

    function setAdminStatusMessage(message) {
        var data = { message: message };
        socket.emit('setAdminStatusMessage', data);
    }

    function getQuestions() {
        var questions = [];
        var question1 = { question: "Wat zouden waarden voor Flevoland (SWiF) kunnen zijn?", type: 'multiple', A: "Creatief - Inspiratie - Ontdekken - Samenzijn", B: "Doelgericht - Effici&euml;nt - Kennis - Meesterschap", C: "Dienstbaar - Duurzaam - Pionieren - Veelzijdig", D: "Eenvoudigheid - Enthousiasme - Leraarschap - Waardering", Correct: "C" }
        var question2 = { question: "Wat zou een goede formulering zijn van de essentie van werken in Flevoland (SWiF)?", type: 'multiple', A: "Tot rust komen", B: "Economisch wonen en werken", C: "Duurzaam groeien", D: "Pionieren voor beter leven", Correct: "D" }
        var question3 = { question: "Wat zou een onderscheidend en aantrekkelijk aanbod zijn voor iemand om te werken voor de provincie Flevoland?", type: 'multiple', A: "Carri&egrave;re maken", B: "Zinvol werk met veel variatie", C: "Snel geld verdienen", D: "Internationale werkomgeving", Correct: "B" }
        var question4 = { question: "Formuleer in één korte en krachtige zin wat je toekomstige werknemers kan beloven als ze komen werken voor de provincie Flevoland?", type: 'open'}
        questions.push(question1);
        questions.push(question2);
        questions.push(question3);
        //questions.push(question4);

        return questions;
    }
});