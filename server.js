const express = require('express');

const app = express();

const favicon = require('serve-favicon');

const expressLayouts = require('express-ejs-layouts');

const fs = require('fs');

const path = require('path');

const Uber = require('node-uber');

const url = require('url');

const session = require('cookie-session');

const async = require('async');

const dataAccess = require('./datalayer/data-access');

const config = require('./config/config');

// Create new Uber instance
const uber = new Uber({
  client_id: config.client_id,
  client_secret: config.client_secret,
  server_token: config.server_token,
  redirect_uri: config.redirect_uri,
  name: config.app_name,
  sandbox: config.sandbox,
});

// Set EJS as View Engine
app.set('view engine', 'ejs');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(session({ secret: 'sober' }));
app.use((req, res, next) => {
  if (typeof (req.session.rider_id) === 'undefined') {
    req.session.rider_id = '';
  }
  next();
});
app.use(favicon('./favicon.ico'));
app.use(expressLayouts);

// Root URL
app.get('/', (req, res) => {
  res.locals = { title: 'Sober - Login', login: false };
  res.render('login.ejs');
});

// On clicking Login redirect to Uber
app.post('/login', (req, res) => {
  // Get Authorization URL
  const authURL = uber.getAuthorizeUrl(['history', 'profile']);
  res.redirect(authURL);
});

// Get response from Uber
app.get('/login/callback', (req, res) => {
  const queryString = url.parse(req.url, true).query;
  let authCode = '';

  if ('code' in queryString) {
    authCode = queryString.code;
  }

  uber.authorization({
    authorization_code: authCode,
  }, (error, result) => {
    if (error) {
      res.redirect('/error');
    } else {
      uber.setTokens(result[0], result[1], result[3], result[2]);
      res.redirect('/profile');
    }
  });
});

// Get Ride history from Uber
let count = 0;
let fetched = 0;
const limit = 50;
const getUberHistory = (RiderId, Count, offset, callback) => {
  uber.user.getHistory(offset, limit, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      if (Count === 0) {
        count = result.count;
      }

      dataAccess.insertRides(RiderId, result.history);

      fetched += limit;
      if (count > fetched) {
        getUberHistory(RiderId, count, fetched, callback);
      }
    }
  });
};

// Get Profile Information
app.get('/profile', (req, res) => {
  uber.user.getProfile((error, result) => {
    if (error) {
      res.redirect('/error');
    } else {
      req.session.rider_id = result.rider_id;
      dataAccess.insertUser(result);

      const profileInfo = {
        FullName: `${result.first_name} ${result.last_name}`,
        Email: result.email,
        Picture: result.picture,
        PromoCode: result.promo_code,
        MobileVerified: result.mobile_verified,
      };

      getUberHistory(req.session.rider_id, count, 0, limit);
      res.locals = { title: 'Sober - Rider Profile', login: true };
      res.render('profile.ejs', profileInfo);
    }
  });
});

// Get Ride history from database
app.get('/history', (req, res) => {
  if (req.session.rider_id === 'undefined' || req.session.rider_id === '') {
    res.redirect('/error');
    return;
  }

  let rides = [];
  async.waterfall([

    (cb) => {
      dataAccess.getRides(req.session.rider_id, cb);
    },

  ], (results) => {
    rides = results;
    res.locals = { title: 'Sober - Ride History', login: true };
    res.render('history.ejs', { rides: JSON.stringify(rides) });
  });
});

// Get Ride history from database (Map View)
app.get('/mapview', (req, res) => {
  if (req.session.rider_id === 'undefined' || req.session.rider_id === '') {
    res.redirect('/error');
    return;
  }

  let rides = [];
  async.waterfall([

    (cb) => {
      dataAccess.getRides(req.session.rider_id, cb);
    },

  ], (results) => {
    rides = results;
    res.locals = { title: 'Sober - Ride History', login: true };
    res.render('map.ejs', { rides: JSON.stringify(rides) });
  });
});

// Sync Ride history in database
app.get('/synchistory', (req, res) => {
  getUberHistory(req.session.rider_id, 0, 0, limit);
  res.redirect('/history');
});

// Logout and Clear Uber session
app.get('/logout', (req, res) => {
  uber.revokeToken(uber.access_token, (error) => {
    if (error) {
      console.log(error);
    } else {
      req.session.rider_id = '';
      uber.clearTokens();
      res.redirect('/');
    }
  });
});

app.get('/error', (req, res) => {
  res.locals = { title: 'Sober - Something went wrong', login: false };
  res.render('error.ejs');
});

app.get('*', (req, res) => {
  if (req.url.match('.css$')) {
    const cssPath = path.join(__dirname, req.url);
    const fileStream = fs.createReadStream(cssPath, 'UTF-8');
    res.writeHead(200, { 'Content-Type': 'text/css' });
    fileStream.pipe(res);
  }
});

app.use((req, res, next) => {
  res.redirect('/error');
});

app.listen(config.port);
