const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');

const indexRouter = require('../routes/index');
const usersRouter = require('../routes/users');
const emailRouter = require('../routes/email');
const { router: loginRouter } = require('../routes/login');
const { authenticateJWT } = require('../routes/login');
const documentsRouter = require('../routes/documents');
const session = require('express-session');
const db = require('../../db/database');
const app = express();
// view engine setup
// Il file `app.js` si trova in `src/configuration`, le views sono in `src/views`.
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Global auth middleware to populate req.user if token present
app.use(authenticateJWT);
// Initialize Passport (Local strategy configured in src/configuration/passport.js)
require('./passport')(passport);
app.use(passport.initialize());
// static files (public) sono in `src/public`.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Add db to req
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Configure trust proxy so express-rate-limit and req.ip work correctly when
// the app is behind a proxy or a load balancer that sets X-Forwarded-For.
// Controlled by the TRUST_PROXY env var. Default to '1' (trust first proxy)
// which is a sensible default for many hosted environments. Set TRUST_PROXY
// to 'false' to disable.
const trustProxyEnv = process.env.TRUST_PROXY;
let trustProxyValue = '1';
if (typeof trustProxyEnv !== 'undefined') {
  // allow explicit values like 'false', 'true', '1', 'loopback', etc.
  trustProxyValue = trustProxyEnv;
}
app.set('trust proxy', trustProxyValue);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/email', emailRouter);
app.use('/', loginRouter);
app.use('/documents', documentsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
