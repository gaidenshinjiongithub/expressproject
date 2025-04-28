const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use((req, res, next) => {
  console.log(`[SERVER] ${req.method} ${req.path}`);
  next();
});

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/account', (req, res) => {
  console.log('account data request', req.query);

  const fauxData = {
    firstname: "John",
    lastname: "Doe",
    address_line_1: `${Math.floor(Math.random() * 9999)} Fake St`,
    address_line_2: `UNIT ${Math.floor(Math.random() * 50)}`,
    city: "Nowheresville",
    state: "CA",
    zip: `${Math.floor(Math.random() * 89999) + 10000}`,
    phone: "+1 (123) 456-7891",
    email: "example@example.com"
  };

  res.status(200).json(fauxData);  
});

app.post('/login', (req, res) => {
  console.log('data for login', req.body);
  res.status(200).send({ message: 'login success' });
});

app.post('/register', (req, res) => {
  console.log('Registration Data:', req.body);
  res.status(201).send({ message: 'register success' });
});

app.post('/account', (req, res) => {
  console.log('Account Data Submitted:', req.body);
  res.status(201).send({ message: 'account data received' });
});


const port = parseInt(process.env.PORT) || process.argv[3] || 8080;
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});