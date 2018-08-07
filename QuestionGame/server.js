
'use strict';
var http = require('http');
var port = process.env.PORT || 1337;
var express = require('express');
var app = express();
var path = require('path');

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(port);