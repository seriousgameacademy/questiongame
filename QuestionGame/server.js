'use strict';

//var http = require('http');
//var port = process.env.PORT || 1337;

//http.createServer(function (req, res) {
//    res.writeHead(200, { 'Content-Type': 'text/plain' });
//    res.end('Hello World\n');
//}).listen(port);



var app = require('express')();
var path = require('path');
var port = process.env.PORT || 1337;
var server = require('http').createServer(app);

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

app.get('/', function (req, res) {
    res.sendfile('index.html');
});