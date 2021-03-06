'use strict'

if (!process.env.hasOwnProperty('apiKey')) {
    try {
        require('./local_config.js');
    } catch (err) {}
}
    


var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var routes = require('./routes/index.js');

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


