var express = require('express');
var app = express();
var favicon = require('serve-favicon');
var expressLayouts = require('express-ejs-layouts');
var fs = require('fs');
var path = require('path');
var Uber = require('node-uber');
var url = require('url');
var session = require('cookie-session');
var dataAccess = require('./data-access');
var async = require('async');

//Create new Uber instance
var uber = new Uber({
    client_id: 'hQLKKYa49r11oES39MR5faAQRRTUKPaa',
    client_secret: '4NaDYSaBc0gt7EPYGS9xecY4oFHHxDCcygpDVCnV',
    server_token: 'MuUYC0sMV-G1iXj98GxKpAYQc-vib4NeOvWqx_Hh',
    redirect_uri: 'http://localhost:8080/login/callback',
    name: 'Sober',
    sandbox: true
});

//Set EJS as View Engine
app.set('view engine', 'ejs');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(session({secret: 'sober'}));
app.use(function(req, res, next){
    if (typeof(req.session.rider_id) == 'undefined') {
        req.session.rider_id = '';
    }
    next();
});
app.use(favicon('./favicon.ico'));
app.use(expressLayouts);

//Root URL
app.get('/', function(req,res){
    res.locals = { title: 'Sober - Login' };
    res.render('login.ejs');
});

//On clicking Login redirect to Uber
app.post('/login', function(req, res){
    
    //Get Authorization URL
    var authURL = uber.getAuthorizeUrl(['history', 'profile']);
    res.redirect(authURL);
});

//Get response from Uber
app.get('/login/callback', function(req, res){

    var queryString = url.parse(req.url, true).query;
    var authCode = '';

    if('code' in queryString)
        authCode = queryString.code;

    uber.authorization({
        authorization_code: authCode
    }, function(error, result) {
        if (error) {
            console.error(error);
        } else {
            uber.setTokens(result[0] , result[1] , result[3] , result[2]);
            res.redirect('/profile');     
        }
    });
});

//Get Profile Information
app.get('/profile', function(req,res){

    uber.user.getProfile(function(error, result) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
        } else {
            req.session.rider_id = result.rider_id;
            dataAccess.insertUser(result);

            var profileInfo = { FullName: result.first_name + " " + result.last_name,
                                Email: result.email,
                                Picture: result.picture,
                                PromoCode: result.promo_code,
                                MobileVerified: result.mobile_verified };

            res.locals = { title: 'Sober - Rider Profile' };
            res.render('profile.ejs', profileInfo);
        }
    });
});

//Get Ride history from database
app.get('/history',  function(req,res){
    var rides = [];
    async.waterfall([

        function(cb){
            dataAccess.getRides(req.session.rider_id, cb);
        },
        function(rides, cb){
            cb(null);
        }

    ], function(err, results){
        rides = err;
        res.locals = { title: 'Sober - Ride History' };
        res.render('history.ejs', {rides: JSON.stringify(rides)});
    });
});

//Get Ride history from database (Map View)
app.get('/mapview', function(req, res){
    var rides = [];
    async.waterfall([

        function(cb){
            dataAccess.getRides(req.session.rider_id, cb);
        }

    ], function(err, results){
        rides = err;
        res.locals = { title: 'Sober - Ride History' };
        res.render('map.ejs', {rides: JSON.stringify(rides)});
    });
});

//Sync Ride history in database
var count, fetched = 0;
var limit = 50;
app.get('/synchistory', function(req,res){

    async.waterfall([

        function(cb) {
            getUberHistory(req.session.rider_id, 0, 0, limit, cb);
            cb(null);
        }

    ], function(err, results){
        res.redirect('/history');
    });
});

//Get Ride history from Uber
function getUberHistory(rider_id, count, offset, limit, callback){
    uber.user.getHistory(offset, limit, function(error, result){
        if (error) {
            console.log(error);
        } else {
            
            if(count == 0)
            {
                count = result.count;
            }

            dataAccess.insertRides(rider_id, result.history);

            fetched += limit;
            if(count > fetched)
            {
                getUberHistory(rider_id, count, fetched, limit, callback);
            }
        }
    });
}

//Logout and Clear Uber session
app.get('/logout', function(req,res){
    uber.revokeToken(uber.access_token, function(error, result){
        if (error) {
            console.error('Error: ', error);
        } else {
            console.log('Logged out');
            uber.clearTokens();
            res.redirect('/');
        }
    });
});

app.get('*',function(req,res){
    if(req.url.match('\.css$'))
    {
        var cssPath = path.join(__dirname,req.url);
        var fileStream = fs.createReadStream(cssPath, "UTF-8");
        res.writeHead(200, {"Content-Type": "text/css"});
        fileStream.pipe(res);
    }
});

app.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page cannot be found!');
});

app.listen(8080);