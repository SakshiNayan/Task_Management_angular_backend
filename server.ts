var express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Pool} = require('pg')
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const port = 3000; 

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'task_manage',
    password: 'Postsql@123',
    port: 5432,
  });
 //get all the record
app.get('/api/formdata', (req, res) => {
  pool.query('SELECT * FROM tasks', (error, results) => {
    if (error) {
      console.error('Error executing query', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results.rows);
    }
  });
});

//create a post record
app.post('/api/formdata', async (req, res) => {
  const { firstname, lastname, email, task_description, start_time, end_time,status } = req.body;
  const query = 'INSERT INTO tasks (firstname, lastname, email, task_description, start_time, end_time,status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
  const values = [firstname, lastname, email, task_description, start_time, end_time,status];

  try {
    const result = await pool.query(query, values);
    console.log("hello",result);
    res.status(201).json({message:"values inserted"});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    console.log("error",error);
  }
});


// Get a single record by ID
app.get('/api/users/:id', async (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM tasks WHERE id = $1';
  const values = [id];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Update a record
app.put('/api/formdata/:id', async (req, res) => {
  const id = req.params.id;
  const { firstname, lastname, email, task_description, start_time, end_time,status  } = req.body;
  const query = 'UPDATE tasks SET firstname = $1, lastname = $2 , email = $3, task_description = $4, start_time = $5, end_time = $6, status = $7  WHERE id = $8';
  const values = [firstname, lastname, email, task_description, start_time, end_time, status , id];

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json({ message: 'User updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a record
app.delete('/api/formdata/:id', async (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM tasks WHERE id = $1';
  const values = [id];

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json({ message: 'User deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//-----------------------------------------------------------------------------------------------

  app.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Store user information in the database
      const query = `
        INSERT INTO users (username, email, password)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const values = [username, email, hashedPassword];
      const result = await pool.query(query, values);
  
      const userId = result.rows[0].id;
  
      // Generate JWT token
      const token = jwt.sign({ userId }, 'your_secret_key');
  
      res.json({ token });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Retrieve user from the database
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);
      const user = result.rows[0];
  
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
  
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, 'your_secret_key');
  
      res.json({ token });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
