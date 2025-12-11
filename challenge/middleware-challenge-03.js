const express = require('express');
const app = express();

app.use(express.json());


const users = [
  { id: 1, username: 'admin', role: 'admin', apiKey: 'admin-key-123' },
  { id: 2, username: 'user1', role: 'user', apiKey: 'user-key-456' },
  { id: 3, username: 'user2', role: 'user', apiKey: 'user-key-789' }
];


const loggingMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);

  console.log(`Body size: ${JSON.stringify(req.body).length} bytes`);
  next();
};


const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  

  const user = users.find(u => u.apiKey === apiKey);
  
  if (!user) {

    res.status(401).json({ error: 'Invalid API key' });
    next();
  }
  
  req.user = user;
  next();
};


const requireRole = (role) => {
  return (req, res, next) => {

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};


const validateProductInput = (req, res, next) => {
  const { name, price, stock } = req.body;
  

  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  
  next();
};


const errorHandler = (err, req, res, next) => {
  console.error(err);

  res.status(500).json({ error: 'Internal server error' });
};


app.use(errorHandler);
app.use(loggingMiddleware);


app.get('/api/public', (req, res) => {
  res.json({ message: 'This is public' });
});


app.get('/api/protected', apiKeyAuth, (req, res) => {
  res.json({ 
    message: 'This is protected',
    user: req.user.username 
  });
});

app.get('/api/admin', apiKeyAuth, requireRole('admin'), (req, res) => {
  res.json({ 
    message: 'Admin access granted',
    allUsers: users.map(u => ({ id: u.id, username: u.username, role: u.role }))
  });
});


app.post('/api/products', apiKeyAuth, validateProductInput, (req, res) => {
  const { name, price, stock } = req.body;
  

  const product = {
    id: Date.now(),
    name,
    price: parseFloat(price),
    stock: parseInt(stock),
    createdBy: req.user.id
  };
  
  res.status(201).json(product);
});


app.delete('/api/products/batch', apiKeyAuth, requireRole('admin'), (req, res) => {
  const { ids } = req.body;
  

  const deletedCount = ids.length;
  
  res.json({ 
    message: `Deleted ${deletedCount} products`,
    deletedIds: ids 
  });
});


app.post('/api/upload', apiKeyAuth, (req, res) => {

  const file = req.body.file;
  

  if (file.size > 10000000) {
    return res.status(400).json({ error: 'File too large' });
  }
  
  res.json({ message: 'File uploaded', filename: file.name });
});

const checkQuota = (req, res, next) => {

  setTimeout(() => {
    const quotaExceeded = Math.random() > 0.5;
    
    if (quotaExceeded) {
   
      res.status(429).json({ error: 'Quota exceeded' });
    }
    

    next();
  }, 100);
};

const processRequest = (req, res, next) => {

  res.json({ message: 'Request processed' });
};

app.post('/api/process', apiKeyAuth, checkQuota, processRequest);



module.exports = app;
