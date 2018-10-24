var MongoClient = require('mongodb').MongoClient;
var config = require("../config/config");
var async = require("async");
var common = require("../common/common");
var dbo;

const connection = MongoClient.connect(config.mongourl, { useNewUrlParser: true }, (err, db) => {
    if (err)
        console.log(err);
    else
        dbo = db.db("Sober");
});

//Insert User in MongoDb
exports.insertUser = (object) => {

    var data = object;
    var query = { RiderId: data.rider_id };
    dbo.collection("User").find(query).toArray((err, result) => {
        if (err) {
            return 0;
        }

        if (result.length == 0) {
            var myobj = {
                RiderId: data.rider_id,
                FullName: data.first_name + " " + data.last_name,
                Email: data.email,
                Picture: data.picture,
                PromoCode: data.promo_code,
                MobileVerified: data.mobile_verified
            };

            dbo.collection("User").insertOne(myobj, (err, res) => {
                if (err) {
                    return 0;
                }
            });
        }
        else {
            var myobj = {
                $set: {
                    FullName: data.first_name + " " + data.last_name,
                    Email: data.email,
                    Picture: data.picture,
                    PromoCode: data.promo_code,
                    MobileVerified: data.mobile_verified
                }
            };

            dbo.collection("User").updateOne(query, myobj, (err, res) => {
                if (err) {
                    return 0;
                }
            });
        }
    });
}

//Insert Rides in MongoDb
exports.insertRides = (rider_id, object) => {

    async.each(object, (item, callback) => {

        checkRide(rider_id, dbo, item, () => {
            callback();
        });
    },
        (err) => {
            return 1;
        }
    );
}

//Get Rides from MongoDb
exports.getRides = (rider_id, callback) => {

    var rides = [];
    async.waterfall([

        (cb) => {
            var query = { RiderId: rider_id };
            dbo.collection("UserRide").find(query).toArray(cb);
        },
        (results, cb) => {
            rides = results;
            cb(null);
        }

    ], (err, results) => {
        callback(rides);
    });
}

var checkRide = (rider_id, dbo, record, callback) => {
    var query = { RequestId: record.request_id };
    dbo.collection("UserRide").find(query).toArray((err, result) => {
        if (err) {
            return 0;
        }

        if (result.length == 0) {
            var myobj = {
                RiderId: rider_id,
                RequestId: record.request_id,
                Status: record.status,
                Distance: parseFloat(record.distance).toFixed(2),
                RequestTime: common.formatDate(new Date(record.request_time * 1000)),
                StartTime: common.formatDate(new Date(record.start_time * 1000)),
                EndTime: common.formatDate(new Date(record.end_time * 1000)),
                City:
                {
                    Name: record.start_city.display_name,
                    Latitude: record.start_city.latitude,
                    Longitude: record.start_city.longitude
                }
            };

            dbo.collection("UserRide").insertOne(myobj, (err, res) => {
                if (err) {
                    return 0;
                }
            });
        }
    });
}