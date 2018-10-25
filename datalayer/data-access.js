const { MongoClient } = require('mongodb');

const async = require('async');

const config = require('../config/config');

const common = require('../common/common');

let dbo;

MongoClient.connect(config.mongourl, { useNewUrlParser: true }, (err, db) => {
  if (err) {
    console.log(err);
  } else {
    dbo = db.db('Sober');
  }
});

const checkRide = (RiderId, record) => {
  const query = { RequestId: record.request_id };
  dbo.collection('UserRide').find(query).toArray((err, result) => {
    if (err) {
      return 0;
    }

    if (result.length === 0) {
      const myobj = {
        RiderId,
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
            Longitude: record.start_city.longitude,
          },
      };

      dbo.collection('UserRide').insertOne(myobj, (errInsert) => {
        if (errInsert) {
          return 0;
        }
        return 1;
      });
    }
    return 0;
  });
};

// Insert User in MongoDb
exports.insertUser = (object) => {
  const data = object;
  const query = { RiderId: data.rider_id };
  dbo.collection('User').find(query).toArray((err, result) => {
    if (err) {
      return 0;
    }

    if (result.length === 0) {
      const myobj = {
        RiderId: data.rider_id,
        FullName: `${data.first_name} ${data.last_name}`,
        Email: data.email,
        Picture: data.picture,
        PromoCode: data.promo_code,
        MobileVerified: data.mobile_verified,
      };

      dbo.collection('User').insertOne(myobj, (errInsert) => {
        if (errInsert) {
          return 0;
        }
        return 1;
      });
    } else {
      const myobj = {
        $set: {
          FullName: `${data.first_name} ${data.last_name}`,
          Email: data.email,
          Picture: data.picture,
          PromoCode: data.promo_code,
          MobileVerified: data.mobile_verified,
        },
      };

      dbo.collection('User').updateOne(query, myobj, (errUpdate) => {
        if (errUpdate) {
          return 0;
        }
        return 1;
      });
    }
    return 1;
  });
};

// Insert Rides in MongoDb
exports.insertRides = (RiderId, object) => {
  async.each(object, (item, callback) => {
    checkRide(RiderId, item, () => {
      callback();
    });
  },
  () => 1);
};

// Get Rides from MongoDb
exports.getRides = (RiderId, callback) => {
  let rides = [];
  async.waterfall([

    (cb) => {
      const query = { RiderId };
      dbo.collection('UserRide').find(query).toArray(cb);
    },
    (results, cb) => {
      rides = results;
      cb(null);
    },

  ], () => {
    callback(rides);
  });
};
