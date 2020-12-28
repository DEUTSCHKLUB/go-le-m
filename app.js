const createError = require('http-errors'),
      express = require('express'),
      path = require('path'),
      cookieParser = require('cookie-parser'),
      logger = require('morgan'),
      sassMiddleware = require('node-sass-middleware'),
      srcPath = __dirname + '/assets/',
      destPath = __dirname + '/public/';

// Routes
const indexRouter = require('./routes/index');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// SASS Compilation
app.use(sassMiddleware({
  src: srcPath,
  dest: destPath,
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true,
  includePaths: [path.join(__dirname), 'node_modules/bootstrap/scss'],
  debug: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

/* bootstrap icons include from modules. This way we can use them as sprites: e.g.
  <svg class="bi" width="32" height="32" fill="currentColor">
    <use xlink:href="/icons.svg#icon-name-here"/>
  </svg>
*/ 
app.use('/icons.svg', express.static(__dirname + '/node_modules/bootstrap-icons/bootstrap-icons.svg'));

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
