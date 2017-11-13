'use strict'

if (!process.env.hasOwnProperty('apiKey'))
    process.env.apiKey = 'you alphavantage api Key here';


var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.locals.pretty = true;
app.use('/', routes);

app.set('port', 3005);


var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});


