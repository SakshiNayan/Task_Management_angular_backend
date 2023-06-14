var express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg')
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
  var user_id = req.query.user_id;
  var role = req.query.role;
  var query = `SELECT t1.id,t1.user_id,t1.task_description,t1.start_time,t1.end_time,t1.status,t2.username FROM tasks as t1 INNER JOIN users as t2 on t1.user_id = t2.id order by t1.id asc`;
  if (role != 1) {
    query = `SELECT t1.id,t1.user_id,t1.task_description,t1.start_time,t1.end_time,t1.status,t2.username FROM tasks as t1 INNER JOIN users as t2 on t1.user_id = t2.id where t1.user_id = ${user_id} order by t1.id asc`;
  }
  pool.query(query, (error, results) => {
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
  const { user_id, task_description, start_time, end_time, status } = req.body;
  const query = 'INSERT INTO tasks (user_id, task_description, start_time, end_time,status) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const values = [user_id, task_description, start_time, end_time, status];

  try {
    const result = await pool.query(query, values);
    console.log("hello", result);
    res.status(201).json({ message: "values inserted" });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    console.log("error", error);
  }
});


// Get a single record by ID
app.get('/api/formdata/:id', async (req, res) => {
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
  const { user_id, task_description, start_time, end_time, status } = req.body;
  const query = 'UPDATE tasks SET user_id = $1, task_description = $2, start_time = $3, end_time = $4, status = $5  WHERE id = $6';
  const values = [user_id, task_description, start_time, end_time, status, id];

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

app.get('/api/user-list', (req, res) => {
  pool.query('select * from users where role = 2 order by id asc', (error, results) => {
    if (error) {
      console.error('Error executing query', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results.rows);
    }
  });
});



//--------------------------Login ------------Register---------------------------------------------------------

app.post('/register', async (req, res) => {

  try {
    const { username, email, password } = req.body;
    const userExists = await checkUserExists(username);
    if (userExists) {
      return res.status(409).json({ error: 'User already Exist' });
    }

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

    res.status(201).json({ message: 'User registered successfully', token });
    //console.log(result);

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;


    // Check if the user exists
    const userExists = await checkUserExists(username);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Retrieve user from the database
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    const user = result.rows[0];

    //verify user
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, 'your_secret_key');

    res.status(200).json({ message: 'Login successful', token, user });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statusUpdate', async (req, res) => {
  var status = req.query.status;
  var id = req.query.id;
  var query = `UPDATE tasks SET status ='${status}' WHERE ID = ${id}`;  
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(results.rows);
    }
  });
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


async function checkUserExists(username) {
  const query = 'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)';
  const result = await pool.query(query, [username]);
  return result.rows[0].exists;
}

// Function to check if the password is correct
async function checkPassword(username, password) {
  const query = 'SELECT password FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0].password === password;
}