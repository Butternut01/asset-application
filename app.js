require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const inventoryRoutes = require('./routes/inventory');
const cors = require('cors');
const app = express();
const session = require('express-session');
const { passport, isAdmin } = require('./middleware/auth');
// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory';
console.log('Connecting to MongoDB:', mongoUri);

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');

    // Проверка наличия коллекций
    mongoose.connection.once('open', () => {
      mongoose.connection.db.listCollections().toArray((err, collections) => {
        if (err) {
          console.error('Error listing collections:', err);
        } else {
          console.log('Available collections:', collections.map(c => c.name));
        }
      });
    });
  })
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Session and Passport middleware (MUST come before routes)
app.use(session({
  secret: process.env.SESSION_SECRET || 'admin123',
  resave: false,
  saveUninitialized: false
}));
//middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cors());


// Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/admin', isAdmin, require('./routes/admin'));

// Auth routes
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ success: true, user: { username: user.username, role: user.role } });
    });
  })(req, res, next);
});

app.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});
// Main route
app.get('/', (req, res) => {
  res.render('index');
});
// Add admin view route
app.get('/admin', isAdmin, (req, res) => {
  res.render('admin');
});

// Dashboard route
app.get('/dashboard', isAdmin, (req, res) => {
  res.render('dashboard');
});

// Public QR asset page — accessible without login (for phone scanning)
app.get('/asset/:id', async (req, res) => {
  try {
    const Inventory = require('./models/Inventory');
    const mongoose = require('mongoose');
    let item = null;

    // Try by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      item = await Inventory.findById(req.params.id);
    }
    // Fallback: search by inventory_number (useful for manual URL entry)
    if (!item) {
      item = await Inventory.findOne({ inventory_number: req.params.id });
    }

    if (!item) {
      return res.status(404).send(`
        <html><head><meta charset="UTF-8"><title>Не найдено</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{font-family:sans-serif;text-align:center;padding:3rem;background:#f0f2f5;}</style></head>
        <body><h2>Актив не найден</h2>
        <p>К сожалению, оборудования с таким идентификатором нет в базе.</p>
        <a href="/">На главную</a></body></html>
      `);
    }

    res.render('asset', { item });
  } catch (err) {
    console.error('Asset QR route error:', err);
    res.status(500).send('Ошибка сервера');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
