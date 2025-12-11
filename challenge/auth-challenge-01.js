const express = require('express');
const jwt = require('jsonwebtoken');

// BUG 1: Memory leak - users array grows indefinitely
// BUG 2: Password comparison is not secure (plain text)
// BUG 3: Missing error handling for invalid tokens

const users = [];
const SECRET_KEY = 'super-secret-key';

const app = express();
app.use(express.json());

// Registration endpoint
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;
  
  // BUG: No validation of input
  // BUG: Storing passwords in plain text
  // BUG: No check for duplicate usernames
  users.push({
    id: users.length + 1,
    username,
    password,
    email,
    createdAt: new Date()
  });
  
  res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // BUG: Inefficient linear search for every login
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    // BUG: Reveals whether username exists
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // BUG: Token never expires
  const token = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY);
  
  res.json({ token, user: { id: user.id, username: user.username } });
});

// Protected endpoint
app.get('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  // BUG: No check if authorization header exists
  const token = authHeader.split(' ')[1];
  
  try {
    // BUG: No verification of token signature
    const decoded = jwt.decode(token);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // BUG: Exposing password in response
    res.json({ user });
  } catch (error) {
    // BUG: Generic error message
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Delete user endpoint
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  // BUG: No authentication check
  // BUG: Not actually removing from array, just finding
  const userIndex = users.findIndex(u => u.id === parseInt(userId));
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // BUG: This doesn't actually delete the user!
  users.indexOf(users[userIndex]);
  
  res.json({ message: 'User deleted successfully' });
});

module.exports = app;
