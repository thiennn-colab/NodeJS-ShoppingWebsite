const path = require('path');
const fs = require('fs')

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const csrf = require('csurf')
const flash = require('connect-flash')
const multer = require('multer')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')



const errorController = require('./controllers/error');
const User = require('./models/user');


const app = express();
const store = new MongoDBStore({
  uri: process.env.MONGODB,
  collection: 'sessions'
})
const csrfProtecttion = csrf()


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getDate() + (new Date().getMonth()+1).toString() + new Date().getFullYear() + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const testRoutes = require('./routes/test')

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})

app.use(helmet())
app.use(compression())
app.use(morgan('common', {stream: accessLogStream}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
)
app.use(csrfProtecttion)
app.use(flash())
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken()
  res.locals.oldInput = {}
  next()
})

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

app.use(testRoutes)
app.use(authRoutes);
app.use(shopRoutes);
app.use('/admin', adminRoutes);
app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error)
  res.status(500).render('500', { pageTitle: 'Internal Server Error', path: '/505' });
})

mongoose
  .connect(
      process.env.MONGODB,
      { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(result => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Listening to port ${process.env.PORT || 3000}`)
    });
  })
  .catch(err => {
    console.log(err);
  });
