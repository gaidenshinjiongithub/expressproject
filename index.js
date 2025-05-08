const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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


app.post('/login', async (req, res) => {
  const { user_name, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, password FROM user_accounts WHERE user_name = $1',
      [user_name]
    );

    if (result.rowCount === 0) {
      return res.status(400).send({ message: 'User does not exist' });
    }

    if (result.rows[0].password === password) {
      return res.status(200).send({ id: result.rows[0].id });
    } else {
      return res.status(401).send({ message: 'Incorrect password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send({ message: 'Server error' });
  }
});


app.post('/register', async (req, res) => {
  const { user_name, password } = req.body;
  try {
    const check = await pool.query(
      'SELECT id FROM user_accounts WHERE user_name = $1',
      [user_name]
    );

    if (check.rowCount > 0) {
      return res.status(409).send({ message: 'Username already taken' });
    }

    const result = await pool.query(
      'INSERT INTO user_accounts (user_name, password) VALUES ($1, $2) RETURNING id',
      [user_name, password]
    );

    res.status(201).send({ id: result.rows[0].id });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send({ message: 'Server error' });
  }
});


app.post('/account', async (req, res) => {
  const {
    user_id, first_name, last_name,
    address_1, address_2, city,
    state, zip_code, phone_number, email
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users_accounts_details (
        user_id, first_name, last_name, address_1, address_2,
        city, state, zip_code, phone_number, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [user_id, first_name, last_name, address_1, address_2, city, state, zip_code, phone_number, email]
    );

    res.status(201).send(result.rows[0]);
  } catch (err) {
    console.error('Account POST error:', err);
    res.status(500).send({ message: 'Error inserting account details' });
  }
});


app.get('/account', async (req, res) => {
  const user_id = req.query.user_id;

  try {
    const result = await pool.query(
      'SELECT * FROM users_accounts_details WHERE user_id = $1',
      [user_id]
    );

    if (result.rowCount === 0) {
      return res.status(204).send();
    }

    res.status(200).send(result.rows[0]);
  } catch (err) {
    console.error('Account GET error:', err);
    res.status(500).send({ message: 'Error retrieving account details' });
  }
});


app.put('/account', async (req, res) => {
  const {
    user_id, first_name, last_name,
    address_1, address_2, city,
    state, zip_code, phone_number, email
  } = req.body;

  try {
    const check = await pool.query(
      'SELECT * FROM users_accounts_details WHERE user_id = $1',
      [user_id]
    );

    if (check.rowCount === 0) {
      return res.status(404).send({ message: 'No account found' });
    }

    const result = await pool.query(
      `UPDATE users_accounts_details SET
        first_name = $1,
        last_name = $2,
        address_1 = $3,
        address_2 = $4,
        city = $5,
        state = $6,
        zip_code = $7,
        phone_number = $8,
        email = $9
      WHERE user_id = $10
      RETURNING *`,
      [first_name, last_name, address_1, address_2, city, state, zip_code, phone_number, email, user_id]
    );

    res.status(200).send(result.rows[0]);
  } catch (err) {
    console.error('Account PUT error:', err);
    res.status(500).send({ message: 'Error updating account details' });
  }
});


const port = parseInt(process.env.PORT) || process.argv[3] || 8080;
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
