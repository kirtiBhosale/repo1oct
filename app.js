/* eslint-disable */

// importing modules

const express = require('express');
const auth = require('cirrus-auth-module');
const exphbs = require('express-handlebars');
const forceSSL = require('express-force-ssl');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
// const headerfooter = require('./src/server-controllers/global_variables');
// const favicon = require('serve-favicon');
const helmet = require('helmet');
const moment = require('moment');
const fileupload = require('express-fileupload');

// Importing the express module under the `app` variable
const app = express();
global.appServer = app;
app.use(fileupload());

auth.authenticate(app);
if (process.env.FORCE_HTTPS_PROD === 'true') {
  app.get('*', (req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect(301, `https://www.myeem.io${req.url}`);
    } else if (req.headers.host.match(/^www/) == null) {
      res.redirect(301, `https://www.myeem.io${req.url}`);
    } else {
      next();
    }
  });
}
/* If the user is local development import the .env file, else do not load the
.env file. Also if production is set start newrelic for monitoring*/
if (app.get('env') === 'development') {
  /* eslint-disable global-require */
  require('dotenv').config();
} else if (app.get('env') === 'production') {
  // Import the NewRelic Module.
  require('newrelic');
  // Force https protocol for any connection
  app.use(forceSSL);
  /* Ensure that the XFPHeader is trusted, otherwise can cause redirect loop */
  app.set('forceSSLOptions', {
    trustXFPHeader: true,
    sslRequireMessage: 'SSL Required.',
  });
} else {
  console.log('Please set your NODE_ENV to either `development` or `production`');
}

// Importing the favicon, remove if you do not have one.
// app.use(favicon(`${__dirname}/lib/public/img/favicon.ico`));

// Added further layer of security
app.use(helmet());

/*
  Once a brwoser receives the HSTS header (Strict Transport Security Header)
  that browser will prevent any communications from being sent over HTTP and will
  instead send all communications over HTTPS for a specificied amount of time.

  The 'maxAge' parameter specified how many seconds after the first comm to use
  HTTPS in seconds, therefore 5184000s represents 60 days.
*/
app.use(helmet.hsts({
  maxAge: 5184000,
}));

// Importing all routes to the server
const authenticatedRoutes = require('./src/routes/authenticated-routes');

// Configure the express app
app.use(morgan('combined'));
app.use(bodyParser.json());
// app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({
  extended: false,
  // limit: '500mb',
}));

// compress all routes
app.use(compression());
// view engine setup and public static directory
app.set('views', path.join(__dirname, 'views'));

// helpers
const hbs = exphbs.create({
  defaultLayout: '',
  // Specify helpers which are only registered on this instance.
  helpers: {
    increment(index) { return index + 1; },
    if_eq(a, b,c, opts){
      if (a == b || a==c) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
    },
    checkscore(score){
      return (score=='NaN' || score==undefined || score==null) ? 0 : score;
    },
    modifydate(modifiedDate) {
      if (modifiedDate === '' || modifiedDate === undefined || modifiedDate === 'undefined' || modifiedDate === null) {
        console.log('Date is not defined');
        return '';
      }
      const mD = moment(new Date(modifiedDate)).format('DD-MMM-YYYY');
      console.log(mD);
      return (mD);
    },
    ifThird(index, options) {
      if (index % 3 === 0) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  }
});
// app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'lib/public')));
app.use(express.static(path.join(__dirname, 'src/public')));//added by kirti for desgin part showing

// var MomentHandler = require("handlebars.moment");
// MomentHandler.registerHelpers(hbs);

global.appServer.locals.footercontent = 'footer MYEEM';
// Load authenticated routes
app.use('/', authenticatedRoutes);
// app.all('/*', (req, res, next) => {
//   console.log('123....................');
//   //headerfooter.GetGlobalEntriesAppData(req, res, next);
//   next();
// });

// catch 404 and forward to error handler
app.use((req, res) => {
  const err = new Error('Page Not Found');
  err.status = 404;
  // next(err);
  res.render('notfound');
});

// development error handler will print stck trace
// To run in development mode set config var NODE_ENV to 'development'
if (app.get('env') === 'development') {
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// production error handler. No stacktraces leaked to user
app.use((err, req, res) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

// hbs.registerHelper('if_eq', function(a, b,c, opts) {
//   if (a == b || a==c) {
//       return opts.fn(this);
//   } else {
//       return opts.inverse(this);
//   }
// });
module.exports = app;
