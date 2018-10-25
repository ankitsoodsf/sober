const config = {};

config.port = process.env.PORT || 8080;
config.app_name = 'Sober';
config.client_id = process.env.client_id || 'i42z8ALhlAFz93X1jwqA-CdgVN01PvF7';
config.client_secret = process.env.client_secret || 'lu_AYFvVJfYtHi-7NOXspnUWtY02LGV7oZN3ses6';
config.server_token = process.env.server_token || '0_w55at0O80yb4OoawaQB1owpKNjccI9llO7v4i3';
config.redirect_uri = process.env.redirect_uri || 'http://localhost:8080/login/callback';
config.sandbox = process.env.sandbox || true;
config.mongourl = 'mongodb://localhost:27017/';

module.exports = config;
