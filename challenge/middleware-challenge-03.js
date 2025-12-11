const express = require('express');
const app = express();

app.use(express.json());

// BUG 1: Middleware order issues
// BUG 2: Missing error handling in middleware
// BUG 3: Request validation bugs
// BUG 4: Response already sent errors

// Simulate user database
const users = [
  { id: 1, username: 'admin', role: 'admin', apiKey: 'admin-key-123' },
  { id: 2, username: 'user1', role: 'user', apiKey: 'user-key-456' },
  { id: 3, username: 'user2', role: 'user', apiKey: 'user-key-789' }
];

// BUG: Logging middleware throws error with missing body
const loggingMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  // BUG: This will crash if body is undefined
  console.log(`Body size: ${JSON.stringify(req.body).length} bytes`);
  next();
};

// API Key authentication middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // BUG: No check if apiKey exists
  const user = users.find(u => u.apiKey === apiKey);
  
  if (!user) {
    // BUG: Sends response but doesn't return, next() still called
    res.status(401).json({ error: 'Invalid API key' });
    next();
  }
  
  req.user = user;
  next();
};

// Role-based authorization middleware
const requireRole = (role) => {
  return (req, res, next) => {
    // BUG: No check if req.user exists
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Input validation middleware
const validateProductInput = (req, res, next) => {
  const { name, price, stock } = req.body;
  
  // BUG: Only checks existence, not type
  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // BUG: Doesn't validate that price/stock are numbers
  // BUG: Doesn't check for negative values
  
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err);
  // BUG: Always sends 500, doesn't check if headers already sent
  res.status(500).json({ error: 'Internal server error' });
};

// BUG: Middleware applied in wrong order - errorHandler should be last
app.use(errorHandler);
app.use(loggingMiddleware);

// Public endpoint (no authentication needed)
app.get('/api/public', (req, res) => {
  res.json({ message: 'This is public' });
});

// Protected endpoint
app.get('/api/protected', apiKeyAuth, (req, res) => {
  res.json({ 
    message: 'This is protected',
    user: req.user.username 
  });
});

// Admin-only endpoint
app.get('/api/admin', apiKeyAuth, requireRole('admin'), (req, res) => {
  res.json({ 
    message: 'Admin access granted',
    allUsers: users.map(u => ({ id: u.id, username: u.username, role: u.role }))
  });
});

// Create product with validation
app.post('/api/products', apiKeyAuth, validateProductInput, (req, res) => {
  const { name, price, stock } = req.body;
  
  // BUG: No try-catch for potential errors
  const product = {
    id: Date.now(),
    name,
    price: parseFloat(price), // BUG: This can return NaN
    stock: parseInt(stock), // BUG: This can return NaN
    createdBy: req.user.id
  };
  
  res.status(201).json(product);
});

// Batch delete endpoint (middleware order bug)
app.delete('/api/products/batch', apiKeyAuth, requireRole('admin'), (req, res) => {
  const { ids } = req.body;
  
  // BUG: No validation of ids
  // BUG: Can throw error if ids is not an array
  const deletedCount = ids.length;
  
  res.json({ 
    message: `Deleted ${deletedCount} products`,
    deletedIds: ids 
  });
});

// Upload endpoint (missing validation)
app.post('/api/upload', apiKeyAuth, (req, res) => {
  // BUG: No file size validation
  // BUG: No file type validation
  const file = req.body.file;
  
  // BUG: Throws error if file is undefined
  if (file.size > 10000000) {
    return res.status(400).json({ error: 'File too large' });
  }
  
  res.json({ message: 'File uploaded', filename: file.name });
});

// Chained middleware with bugs
const checkQuota = (req, res, next) => {
  // BUG: Async operation without proper handling
  setTimeout(() => {
    const quotaExceeded = Math.random() > 0.5;
    
    if (quotaExceeded) {
      // BUG: Might send response after timeout
      res.status(429).json({ error: 'Quota exceeded' });
    }
    
    // BUG: Always calls next() even when quota exceeded
    next();
  }, 100);
};

const processRequest = (req, res, next) => {
  // BUG: Assumes previous middleware didn't send response
  res.json({ message: 'Request processed' });
};

app.post('/api/process', apiKeyAuth, checkQuota, processRequest);

// BUG: Error handler placed before routes, should be after
// app.use(errorHandler); // Should be here instead

module.exports = app;
