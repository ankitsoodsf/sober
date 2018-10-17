
# Sober

Sober is an application that lets user login using there Uber account and check their profile information and ride history.

## Installation

Before you begin, you need to register your app in the [Uber developer dashboard](https://developer.uber.com/dashboard). Notice that the app gets a client ID, secret, and server token required for authenticating with the API.
This information has to be added in the config.js file.

Next, initialize the Uber object with the keys you obtained from the [Uber developer dashboard](https://developer.uber.com/dashboard):

```javasctipt
var uber = new Uber({
  client_id: 'CLIENT_ID',
  client_secret: 'CLIENT_SECRET',
  server_token: 'SERVER_TOKEN',
  redirect_uri: 'REDIRECT URL',
  name: 'APP_NAME',
  sandbox: true
});
```

However, sample account from testing is already mentioned there.

## Working

#### Ride Profile

Upon successful login, user will be redirected to the profile page with following information:

- Picture
- Full Name
- Email Address
- Promo Code
- Mobile Verification Status

#### History

History page will display the number of rides taken by the user and list of the same with following details:

- City
- Distance (in km)
- Time
- Status

This page will also have a button to Sync Rides with your Uber account.
On clicking this button, latest ride history will be fetched from Uber API and sync'd in the database.

#### Map View

User will see an option to see ride history in map.
On clicking this, Google map will be shown displaying markers on all the cities where user have rides.

#### Logout

Logout will take the user back to home screen and kill all session variables of Uber API.

