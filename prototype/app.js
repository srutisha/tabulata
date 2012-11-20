#!/usr/bin/env node

/*
 * Tabulata -- Calculate and Aggregate Lists
 *
 * Copyright (C) 2012 Samuel Rutishauser (samuel@rutishauser.name)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Module dependencies.
 */

var express = require('express')
      , routes = require('./routes')
      , user = require('./routes/user')
      , http = require('http')
      , path = require('path')
      , redis = require("redis")
      , tabulataData = require("./app/server/data")
      , async = require("async")
      , nconf = require('nconf')
      , igneous = require('igneous');

var app = express();

nconf.file({ file: './config/config.json' });

var environment = process.env.NODE_ENV || "local";

console.log("have db-key: "+environment);

var port = nconf.get('database-'+environment+':port'),
    host = nconf.get('database-'+environment+':host'),
    pass = nconf.get('database-'+environment+':password');

var db = redis.createClient(port, host);

db.auth(pass, function (err) {
    if (err) {
        throw err;
    }
});

var igneous_middleware = igneous({
    root: __dirname +'/app',
    minify: environment == 'production',
    flows: [
        {
            route: 'scripts/application-frontend.js',
            type: 'js',
            paths: [
                'lib-distr',
                'client/frontend',
                'interface'
            ]
        },
        {
            route: 'scripts/application-backend.js',
            type: 'js',
            paths: [
                'client/backend',
                'engine',
                'generated',
                'interface'
            ]
        }
    ]
})


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
    app.use(function test (req, res, next){
        res.header('Access-Control-Allow-Origin', '*');
        next();
    });
    app.use( igneous_middleware );
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
