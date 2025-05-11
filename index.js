const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const bcrypt = require('bcryptjs');


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

    const storedHash = result.rows[0].password;
    const isMatch = await bcrypt.compare(password, storedHash);

    if (isMatch) {
      return res.status(200).send({ primaryId: result.rows[0].id });
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

    res.status(201).send({ primaryId: result.rows[0].id });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send({ message: 'Server error' });
  }
});


app.post('/account', async (req, res) => {
  const {
    userId, firstname, lastname,
    address_line_1, address_line_2, city,
    state, zip, phone, email
  } = req.body;

  try {
    const check = await pool.query(
      'SELECT * FROM user_account_details WHERE user_id = $1',
      [userId]
    );

    if (check.rowCount > 0) {
      return res.status(200).send({
        message: 'Account already exists.',
        account: check.rows[0],
      });
    }

    const result = await pool.query(
      `INSERT INTO user_account_details (
        user_id, first_name, last_name, address_1, address_2,
        city, state, zip_code, phone_number, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [userId, firstname, lastname, address_line_1, address_line_2, city, state, zip, phone, email]
    );

    res.status(201).send(result.rows[0]);
  } catch (err) {
    console.error('Account POST error:', err);
    res.status(500).send({ message: 'Error inserting account details' });
  }
});


app.get('/account', async (req, res) => {
  const userId = req.query.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM user_account_details WHERE user_id = $1',
      [userId]
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
    userId, firstname, lastname,
    address_line_1, address_line_2, city,
    state, zip, phone, email
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO user_account_details (
        user_id, first_name, last_name, address_1, address_2,
        city, state, zip_code, phone_number, email
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        address_1 = EXCLUDED.address_1,
        address_2 = EXCLUDED.address_2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip_code = EXCLUDED.zip_code,
        phone_number = EXCLUDED.phone_number,
        email = EXCLUDED.email
      RETURNING *;
      `,
      [userId, firstname, lastname, address_line_1, address_line_2, city, state, zip, phone, email]
    );

    res.status(200).send(result.rows[0]);
  } catch (err) {
    console.error('Account UPSERT error:', err);
    res.status(500).send({ message: 'Error saving account details' });
  }
});


const port = parseInt(process.env.PORT) || process.argv[3] || 8080;
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
