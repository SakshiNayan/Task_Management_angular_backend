// import express, {Request, Response} from 'express';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Pool} = require('pg')
const app = express();
const port = 3000; 

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

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
app.put('/api/users/:id', async (req, res) => {
  const id = req.params.id;
  const { name, email } = req.body;
  const query = 'UPDATE users SET name = $1, email = $2 WHERE id = $3';
  const values = [name, email, id];

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