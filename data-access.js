var MongoClient = require('mongodb').MongoClient;
var mongoUrl = "mongodb://localhost:27017/";
var async = require("async");
var common = require("./common");

//Insert User in MongoDb
exports.insertUser = function(object){
    
    MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
        if (err) {
            return 0;
        }
        var dbo = db.db('Sober');
        var data = object;
        var query = { RiderId: data.rider_id };
        dbo.collection("User").find(query).toArray(function(err, result) {
            if (err) {
                return 0;
            }
            
            if(result.length == 0)
            {
                var myobj = {
                    RiderId: data.rider_id,
                    FullName: data.first_name + " " + data.last_name,
                    Email: data.email,
                    Picture: data.picture,
                    PromoCode: data.promo_code,
                    MobileVerified: data.mobile_verified };

                dbo.collection("User").insertOne(myobj, function(err, res) {
                    if (err) {
                        return 0;
                    }
                    db.close();
                });
            }
            else
            {
                var myobj = { $set: {
                    FullName: data.first_name + " " + data.last_name,
                    Email: data.email,
                    Picture: data.picture,
                    PromoCode: data.promo_code,
                    MobileVerified: data.mobile_verified }};

                dbo.collection("User").updateOne(query, myobj, function(err, res) {
                    if (err) {
                        return 0;
                    }
                    db.close();
                });
            }
        });
    });
}

//Insert Rides in MongoDb
exports.insertRides = function(rider_id, object){
    MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, db) {
        if (err) {
            return 0;
        }
        var dbo = db.db("Sober");
        async.each(object, function(item, callback){
            
            checkRide(rider_id, dbo, item, function (){
                callback();
            });
            },
            function(err){
                db.close();
            }
        );
    });
}

//Get Rides from MongoDb
exports.getRides = function(rider_id, callback){

    var rides = [];
    async.waterfall([

        function(cb)
        {
            MongoClient.connect(mongoUrl, { useNewUrlParser: true },cb);
        },
        function(db, cb)
        {
            var dbo = db.db('Sober');
            var query = { RiderId: rider_id };
            dbo.collection("UserRide").find(query).toArray(cb);
        },
        function(results, cb){
            rides = results;
            cb(null);
        }

    ], function(err, results){
        callback(rides);
    });
}

function checkRide(rider_id, dbo, record, callback)
{
    var query = { RequestId: record.request_id };
    dbo.collection("UserRide").find(query).toArray(function(err, result) {
        if (err) {
            return 0;
        }

        if(result.length == 0)
        {
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
                }};

            dbo.collection("UserRide").insertOne(myobj, function(err, res) {
                if (err) {
                    return 0;
                }
            });
        }
    });
}