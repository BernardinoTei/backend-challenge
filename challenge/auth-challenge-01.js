const express = require('express');
const jwt = require('jsonwebtoken');



const users = [];
const SECRET_KEY = 'super-secret-key';

const app = express();
app.use(express.json());


app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;
  

  users.push({
    id: users.length + 1,
    username,
    password,
    email,
    createdAt: new Date()
  });
  
  res.status(201).json({ message: 'User registered successfully' });
});


app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  

  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {

    return res.status(401).json({ error: 'Invalid credentials' });
  }
  

  const token = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY);
  
  res.json({ token, user: { id: user.id, username: user.username } });
});


app.get('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  

  const token = authHeader.split(' ')[1];
  
  try {

    const decoded = jwt.decode(token);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
   
    res.json({ user });
  } catch (error) {
  
    res.status(401).json({ error: 'Invalid token' });
  }
});


app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  

  const userIndex = users.findIndex(u => u.id === parseInt(userId));
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  

  users.indexOf(users[userIndex]);
  
  res.json({ message: 'User deleted successfully' });
});

module.exports = app;
