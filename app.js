import express from 'express';
import mongoose from 'mongoose';
import User from './models/User.js';
import Letter from './models/Letter.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import methodOverride from 'method-override';


dotenv.config({ path: './process.env' });

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('uploads'));

// Session setup
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL })
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('_method'));


// Connect-flash setup
app.use(flash());

// Middleware to make flash messages available to all views
app.use((req, res, next) => {
  res.locals.flashMessages = req.flash();
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Configure the local strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username })
      .then(user => {
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      })
      .catch(err => done(err));
  }
));

// Serialize and deserialize user
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// File upload setup with Multer and Sharp
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const dataFilePath = path.join('uploads', 'data.json');

// Helper function to read data from the JSON file
const readData = () => {
  if (fs.existsSync(dataFilePath)) {
    const fileData = fs.readFileSync(dataFilePath);
    return JSON.parse(fileData);
  }
  return [];
};

// Helper function to write data to the JSON file
const writeData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// Routes for rendering index and upload pages
app.get('/', (req, res) => {
  try {
    // Render index.ejs instead of upload.ejs
    res.render('index');
  } catch (err) {
    console.error('Error rendering index page:', err);
    res.status(500).send('Server error');
  }
});

app.get('/upload', (req, res) => {
  try {
    const files = readData();
    res.render('upload', { files: files });
  } catch (err) {
    console.error('Error rendering upload page:', err);
    res.status(500).send('Server error');
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded or file type not allowed.');
  }

  const fileName = req.file.originalname.split('.')[0] + '-' + Date.now() + path.extname(req.file.originalname);
  const filePath = path.join('uploads', fileName);

  try {
    if (req.file.mimetype.startsWith('image/')) {
      await sharp(req.file.buffer)
        .resize(300)
        .toFile(filePath);
    } else {
      fs.writeFileSync(filePath, req.file.buffer);
    }

    const newEntry = {
      topic: req.body.topic,
      link: req.body.link,
      who: req.body.who,
      fileName: fileName
    };

    const data = readData();
    data.push(newEntry);
    writeData(data);

    res.redirect('/');
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file');
  }
});

app.delete('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Implement code to delete the entry/file with the specified ID
    // For example, if you're using Mongoose for MongoDB:
    await Letter.findByIdAndDelete(id);
    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Define other routes
import routes from './routes/routes.js';
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



