'use strict';

//init variables

var questionselected = -1;
var gamestate = "start"; // start, waiting, question, questionresult, gameover
var totalamountplayers = 0;
var totalAnwers_A = 0;
var totalAnwers_B = 0;
var totalAnwers_C = 0;
var totalAnwers_D = 0;
var app = require('express')();
var path = require('path');
var port = process.env.PORT || 1337;
var fs = require('fs');
var server = require('http').createServer(function (req, res) {

    if (req.url == '/vote') {
        fs.readFile('vote.html', function (err, data) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
        });
    }
    else if (req.url == '/score') {
        fs.readFile('score.html', function (err, data) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
        });
    }
    else if (req.url == '/admin') {
        fs.readFile('admin.html', function (err, data) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
        });
    }
    else {
        fs.readFile('index.html', function (err, data) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
        });
    }
});

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

let io = require('socket.io')(server);
let users = [];
let answers = [];
let scores = [];

io.on('connection', function (socket) {
    console.log('A user connected');
    CheckGameState();

    socket.on('setUsername', function (username) {

        if (username == 'Admin') {
            username = username.toLowerCase();
        }

        if (username == 'admin') {
            users = [];
        }
        const user = users.find((user) => user === username.toLowerCase());

        if (user != null) {
            socket.emit('userExists', 'Speler ' + username + ' bestaat al! Probeer een andere naam.');
            console.log(users);
        } else {
            socket.username = username;
            users.push(socket.username.toLowerCase());
            if (socket.username === 'admin') {
                
                questionselected = -1;
                gamestate = "start";
                socket.emit('setScreenType', { type: 'admin' })
                setAdminStatusMessage('Wachten op spelers...');

                totalamountplayers = 0;
                var data_admin = { players: totalamountplayers };
                console.log(data_admin);
                io.sockets.emit('totalamountplayers', data_admin);

                // reset scores
                scores = [];
            }
            else {
                socket.emit('setScreenType', { type: 'player' })
                socket.emit('welkommsg', { message: 'Welkom!', username: socket.username });
                console.log(gamestate);

                totalamountplayers = totalamountplayers + 1;
                var data_player = { players: totalamountplayers };
                console.log(data_player);
                io.sockets.emit('totalamountplayers', data_player);
            }
            
            console.log(users);

            socket.emit('userSet', { username: socket.username });

            if (socket.username != 'admin') {
                var data1 = { message: (socket.username + ' doet ook mee!') };
                console.log(data1);
                io.sockets.emit('clientconnectmsg', data1);
            }

            var totalplayers = users.length - 1; // Do not count admin
            

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
            updateGameStateAll('gameover', null);
            return;
        }

        if (index > questionselected) {
            questionselected++;
            if (questionselected == 0) {
                //reset answers
                answers = [];
            }
        }
        
        var data = { question: questions[questionselected], questionselected: questionselected }
        console.log(data);
        updateGameStateAll('question', questions[questionselected].type);
        setAdminStatusMessage('Weet jij het goede antwoord?...');
        io.sockets.emit('newquestion', data);
    })

    socket.on('getGameRanking', function () {
        var playerscores = [];

        // Sort the object scores by name

        var scoresCalculated = scores;

        scoresCalculated.sort(function (a, b) {
            var a1 = a.name, b1 = b.name;
            if (a1 == b1) return 0;
            return a1 > b1 ? 1 : -1;
        });

        console.log('Ordered scores: ')

        var names = [];

        var name = "";
        for (var i = 0; i < scoresCalculated.length; i++) {
            if (i == 0) {
                name = scoresCalculated[i].name
                names.push(name);
                console.log(name);
            }
            else {
                if (name.toLowerCase() == scoresCalculated[i].name.toLowerCase()) {
                    continue;
                }
                name = scoresCalculated[i].name
                names.push(name);
                console.log(name);
            }
            console.log(scoresCalculated[i]);
        }   

        console.log(names);

        for (var i = 0; i < names.length; i++) {
            var totalscore = 0;
            for (var k = 0; k < scoresCalculated.length; k++) {
                if (scoresCalculated[k].name == names[i]) {
                    totalscore = totalscore + scoresCalculated[k].points;
                }
            }

            var playerscore = { name: names[i], score: totalscore };
            playerscores.push(playerscore)
            console.log(playerscore);
        }

        playerscores.sort(function (a, b) {
            var a1 = a.score, b1 = b.score;
            if (a1 == b1) return 0;
            return a1 < b1 ? 1 : -1;
        });

        var data = { playerscores: playerscores }
        console.log(data);
        io.sockets.emit('setGameRanking', data);
    })

    socket.on('registerScore', function (data) {
        scores.push(data);
        console.log(scores);
    })

    socket.on('getQuestionResult', function (data) {
        getQuestionResult();
    })

    socket.on('setSocketQuestionAnswer', function (data) {
        answers.push(data);
        console.log(answers);
    })

    function updateGameStateAll(state, type) {
        var data = { state: state, username: socket.username, type: type };
        io.sockets.emit('setGameState', data);
        gamestate = state;
    }
    
    function getQuestionResult() {
        var questions = getQuestions();
        var totalAnwers_A = 0;
        var totalAnwers_B = 0;
        var totalAnwers_C = 0;
        var totalAnwers_D = 0;
        var percentageAnswers_A = 0;
        var percentageAnswers_B = 0;
        var percentageAnswers_C = 0;
        var percentageAnswers_D = 0;

        console.log('selectedquestion ' + questionselected.toString());

        for (var i = 0; i < answers.length; i++) {
            if (answers[i].answer == 'A' && answers[i].questionselected == questionselected) {
                totalAnwers_A = totalAnwers_A + 1;
            }
            if (answers[i].answer == 'B' && answers[i].questionselected == questionselected) {
                totalAnwers_B = totalAnwers_B + 1;
            }
            if (answers[i].answer == 'C' && answers[i].questionselected == questionselected) {
                totalAnwers_C = totalAnwers_C + 1;
            }
            if (answers[i].answer == 'D' && answers[i].questionselected == questionselected) {
                totalAnwers_D = totalAnwers_D + 1;
            }
        }

        var totalAnswers = totalAnwers_A + totalAnwers_B + totalAnwers_C + totalAnwers_D;
        if (totalAnswers > 0) {
            percentageAnswers_A = Math.round((totalAnwers_A / totalAnswers) * 100);
            percentageAnswers_B = Math.round((totalAnwers_B / totalAnswers) * 100);
            percentageAnswers_C = Math.round((totalAnwers_C / totalAnswers) * 100);
            percentageAnswers_D = 100 - percentageAnswers_A - percentageAnswers_B - percentageAnswers_C;
        }

        var data = { question: questions[questionselected], questionselected: questionselected, answerA: percentageAnswers_A, answerB: percentageAnswers_B, answerC: percentageAnswers_C, answerD: percentageAnswers_D }
        console.log(data);
        io.sockets.emit('setAnswerResult', data);
        updateGameStateAll('answer', null);
        setAdminStatusMessage('Antwoord ' + questions[questionselected].Correct + ' is het JUISTE antwoord...');
    }

    function CheckGameState() {
        if (gamestate == 'start') {
            updateGameStateSocket('start', null);
        }
        if (gamestate == 'question') {
            var questions = getQuestions();
            var data = { question: questions[questionselected], questionselected: questionselected }
            console.log(data);
            socket.emit('newquestion', data);
            updateGameStateSocket('question', questions[questionselected].type);
        }
        if (gamestate == 'answer') {
            getQuestionResult();
            updateGameStateSocket('answer', null);
        }
        if (gamestate == 'gameover') {
            updateGameStateSocket('gameover', null);
        }
    }

    function updateGameStateSocket(gamestate, gametype) {
        var data = { state: gamestate, username: socket.username, type: gametype };
        socket.emit('setGameState', data);
    }

    function setAdminStatusMessage(message) {
        var data = { message: message };
        socket.emit('setAdminStatusMessage', data);
    }

    function getQuestions() {
        var questions = [];
        //var question1 = { question: "Wat is de merkessentie van Disney?", type: "multiple", A: "Plezier", B: "Magie", C: "Familie vermaak", D: "Rust", Correct: "B" }
        //var question2 = { question: "Wat is de merkessentie van AirBnB?", type: "multiple", A: "Voordelig verblijven", B: "Ontdek diversiteit", C: "Thuis voelen", D: "Vrijheid", Correct: "C" }
        //var question3 = { question: "Wat is de merkessentie van Lexus?", type: "multiple", A: "Goedkoop", B: "Betaalbare luxe", C: "Betrouwbaar", D: "Ultieme rijplezier", Correct: "B" }
        //var question4 = { question: "Wat is de merkessentie van Harley Davidson?", type: "multiple", A: "Stoer", B: "Speels", C: "Eigen identiteit", D: "Bevrijdend", Correct: "D" }
        //questions.push(question1);
        ///questions.push(question2);
        //questions.push(question3);
        //questions.push(question4);

        //var question1 = { question: "", type: "multiple", A: "", B: "", C: "", D: "", Correct: "" }
        
        var question1 = { question: "Hoeveel leden heeft de Haai op dit moment", type: "multiple", A: "45", B: "55", C: "65", D: "75", Correct: "B" };
        var question2 = { question: "Hoeveel procent van de leden heeft een LinkedIn profiel", type: "multiple", A: "78", B: "83", C: "88", D: "93", Correct: "A" }
        var question3 = { question: "Welke motivatie stond centraal bij de kennismakingsgame?", type: "multiple", A: "Doel", B: "Groei", C: "Social", D: "Vermijden", Correct: "C" }
        var question4 = { question: "Hoeveel procent van de Haai leden is een man?", type: "multiple", A: "76%", B: "86%", C: "96%", D: "100%", Correct: "C" }
        var question5 = { question: "Welke  (LinkedIn) skills komen het meest voor bij Haai leden?", type: "multiple", A: "B2B, Sales, Marketing", B: "Management, Coaching, SEO", C: "ICT, Management, Sales", D: "Sales, Marketing, ICT", Correct: "A" }
        var question6 = { question: "Welke motivatie staat centraal wanneer je meespeelt met de postcodeloterij", type: "multiple", A: "Doel", B: "Groei", C: "Social", D: "Vermijden", Correct: "D" }
        var question7 = { question: "Hoeveel functies heeft een Haai lid gemiddeld op LinkedIn staan?", type: "multiple", A: "2.1", B: "2.6", C: "3.1", D: "3.6", Correct: "A" }
        var question8 = { question: "De Groenlandse haai kan heel oud worden, namelijk:", type: "multiple", A: "70 - 120 jaar", B: "130 - 180 jaar", C: "190 - 240 jaar", D: "ouder dan 270 jaar", Correct: "D" }
        var question9 = { question: "Het wifi wachtwoord van de Haai is:", type: "multiple", A: "Wifi-Haai", B: "haaaai-Good2CU", C: "Haai-good2cu", D: "haaaai-GOOD2cu", Correct: "B" }
        var question10 = { question: "Hoeveel verschillende talen spreekt een gemiddeld Haai lid?", type: "multiple", A: "2.5", B: "3", C: "3.5", D: "4", Correct: "B" }
        var question11 = { question: "Wat zijn de drie productgroepen van Serious Game Academy?", type: "multiple", A: "Platform | Training | Gamification", B: "Online | Offline | Blended", C: "Games | Fun | Serious", D: "App | Website | Training", Correct: "A" }
        var question12 = { question: "Ons clubhuis staat op het :", type: "multiple", A: "Visserseiland", B: "Viseiland", C: "Scheepseiland", D: "Visserij eiland", Correct: "A" }
        var question13 = { question: "Welke unieke (LinkedIn) skills bezitten enkele Haai leden?", type: "multiple", A: "Coffee", B: "Environmental law", C: "Art", D: "Alle skills", Correct: "D" }
        var question14 = { question: "De makreel haai heeft het wereldrecord hoogspringen, de haai springt:", type: "multiple", A: "3 meter 60 cm hoog", B: "5 meter 60 cm hoog", C: "7 meter 60 cm hoog", D: "9 meter 60 cm hoog", Correct: "C" }
        var question15 = { question: "De Haai society is opgericht in", type: "multiple", A: "2016", B: "2017", C: "2018", D: "2019", Correct: "C" }

        questions.push(question1);
        questions.push(question2);
        questions.push(question3);
        questions.push(question4);
        questions.push(question5);
        questions.push(question6);
        questions.push(question7);
        questions.push(question8);
        questions.push(question9);
        questions.push(question10);
        questions.push(question11);
        questions.push(question12);
        questions.push(question13);
        questions.push(question14);
        questions.push(question15);
        
        return questions;
    }
});