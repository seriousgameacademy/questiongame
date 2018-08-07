'use strict';
var app = require('express')();
var path = require('path');
var port = process.env.PORT || 1337;
var server = require('http').createServer(app);


//http.createServer(function (req, res) {
//    res.writeHead(200, { 'Content-Type': 'text/plain' });
//    res.end('Hello World\n');
//}).listen(port);
server.listen(port, () => {
    console.log('Server listening at port %d', port);
});