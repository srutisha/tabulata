#!/usr/bin/env node

/**
 * Module dependencies.
 */

var express = require('express')
      , routes = require('./routes')
      , user = require('./routes/user')
      , http = require('http')
      , path = require('path')
      , redis = require("redis")
      , tabulataData = require("./data/index")
      , async = require("async")
      , nconf = require('nconf');

var app = express();

nconf.file({ file: './config/config.json' });

var port = nconf.get('database:port'),
    host = nconf.get('database:host'),
    pass = nconf.get('database:password');

var db = redis.createClient(port, host);

db.auth(pass, function (err) {
    if (err) {
        throw err;
    }
});


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

app.get('/', function(req, res){
    var newUser = tabulataData.generateUuid();
    var score = new Date().getTime();
    async.forEachSeries(tabulataData.exampleBlocks,
        function(block, next) {
            score ++;
            putBlockForUser(newUser, block.prolog.id, block, score, next);
        }, function (err) {
            res.redirect('/table/'+newUser);
        }
    );
});

app.get('/table/:user', routes.index);

app.get('/user/:user', function (req, res) {
    var user = req.params.user;
    db.zrevrange(dbnUserBlock(user), 0, -1, function (err, members) {
        if (members != null && members.length > 0) {
            res.json({'blocks' : members});
        } else {
            res.send(404);
        }
    });
});

app.all("/block/*", function(req, res, next){
    if (req.query.user) {
        req.user = req.query.user;
        next();
    } else {
        res.send(400, 'need user param');
        return;
    }
});

function putBlockForUser(user, uuid, block, score, next) {
    score = score || new Date().getTime();
    block.prolog.updated = score;
    db.zadd(dbnUserBlock(user),  score , uuid, function (err, dbr) {
        db.set(dbnBlock(uuid), JSON.stringify(block), next);
    });
}

// http://localhost:3000/block/5a4206e9-68b7-4582-ad37-81baa40afa20?name=My%20Expenses
app.put('/block/:uuid', function (req, res) {
    var uuid = req.params.uuid;
    db.get(dbnBlock(uuid), function (err, blockData) {
        var block;
        if (blockData == null) {
            if (req.query.name == undefined) {
                res.send(400, 'need name param to create block');
                return next();
            }
            block = tabulataData.emptyBlock(uuid,req.query.name);
        } else {
           block = req.body;
        }

        putBlockForUser(req.user, uuid, block, null, function () {
            res.json(block);
        });
    });
});

app.delete('/block/:uuid', function (req, res) {
    var uuid = req.params.uuid;
    db.del(dbnBlock(uuid), function() {
        db.zrem(dbnUserBlock(req.user), uuid, function () {
            res.send(200);
        });
    })
});

app.get('/block/:uuid', function (req, res) {
    var uuid = req.params.uuid;
    db.get(dbnBlock(uuid), function (erro, strBlock) {
        if (strBlock != null) {
            var block = JSON.parse(strBlock);
            res.json(block);
        } else {
            res.send(404);
        }
    });
});

var dbnBlock = function (uuid) { return 'block:'+uuid };
var dbnUserBlock = function (user) { return 'user:'+user+":blocks"; };

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
