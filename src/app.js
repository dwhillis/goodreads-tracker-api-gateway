const express = require('express');
const mustacheExpress = require('mustache-express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Setup express-session for auth0
const session = require('express-session');
const sess = {
    secret: 'blah',
    cookie: {},
    resave: false,
    saveUninitialized: true
};

if (app.get('env') === 'production') {
    sess.cookie.secure = true;
}
app.use(session(sess));

// Load passport
const dotenv = require('dotenv');
dotenv.config();

const passport = require('passport');
const Auth0Strategy = require('passport-auth0');

const strategy = new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://100.115.92.206:3000/callback'
}, (accessToken, refreshToken, extraParams, profile, done) => {
    return done(null, profile);
});

passport.use(strategy);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

const authRouter = require('./routes/auth');
const dataRouter = require('./routes/data');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const userInViews = require('./middleware/userInViews');

app.use(userInViews());
app.use('/', usersRouter);
app.use('/', authRouter);
app.use('/', dataRouter);
app.use('/', indexRouter);

module.exports = app;
