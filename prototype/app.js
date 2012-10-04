
/**
 * Module dependencies.
 */

var express = require('express')
      , routes = require('./routes')
      , user = require('./routes/user')
      , http = require('http')
      , path = require('path')
      , redis = require("redis");
//      , uuid = require("uuid");

var app = express();

var db = redis.createClient();

db.on("error", function (err) {
    console.log("Error " + err);
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/rd', function(req, res){
    db.incr("counter", function (err, dbr) {
        db.lpush(["values", dbr], function (err, dbr) {
            db.lrange("values", 0, -1, function (err, dbr) {
                res.send("brouhaha: "+dbr.join(","));
            })
        })
    });
});


app.get('/rs', function(req, res){
    db.set("counter", 0,  function (err, dbr) {
        res.send("counter reset.");
    });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
