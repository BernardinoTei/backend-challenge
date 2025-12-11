const express = require('express');
const cors = require('cors');

const app = express();

// BUG 1: CORS misconfiguration - allows all origins
// BUG 2: Missing security headers
// BUG 3: SQL injection vulnerable query building
// BUG 4: Query parameter type coercion bugs

app.use(express.json());

// BUG: Insecure CORS - allows all origins
app.use(cors({
  origin: '*', // Should be specific origins
  credentials: true // Dangerous with wildcard origin
}));

// Simulated database
const articles = [
  { id: 1, title: 'First Post', content: 'Hello world', author: 'Alice', published: true, views: 100 },
  { id: 2, title: 'Second Post', content: 'More content', author: 'Bob', published: true, views: 50 },
  { id: 3, title: 'Draft Post', content: 'Not ready', author: 'Alice', published: false, views: 0 },
  { id: 4, title: 'Popular Post', content: 'Viral content', author: 'Charlie', published: true, views: 1000 }
];

const comments = [
  { id: 1, articleId: 1, text: 'Great post!', author: 'Reader1' },
  { id: 2, articleId: 1, text: 'Thanks', author: 'Reader2' },
  { id: 3, articleId: 2, text: 'Interesting', author: 'Reader1' }
];

// BUG: No security headers
app.get('/api/articles', (req, res) => {
  const { author, published, minViews, sort, limit, page } = req.query;
  
  let filtered = [...articles];
  
  // BUG: Type coercion issues with query params (all come as strings)
  if (published) {
    // BUG: String 'false' is truthy!
    filtered = filtered.filter(a => a.published === published);
  }
  
  if (author) {
    filtered = filtered.filter(a => a.author === author);
  }
  
  // BUG: minViews is a string, comparison will fail
  if (minViews) {
    filtered = filtered.filter(a => a.views >= minViews);
  }
  
  // BUG: SQL-injection-like vulnerability in sort parameter
  if (sort) {
    // Dangerous: directly using user input without validation
    filtered.sort((a, b) => {
      // BUG: eval-like behavior - can inject code
      return eval(`a.${sort} - b.${sort}`);
    });
  }
  
  // BUG: limit and page are strings, math will fail
  const pageNum = page || 1;
  const limitNum = limit || 10;
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  
  const paginated = filtered.slice(startIndex, endIndex);
  
  res.json({
    data: paginated,
    total: filtered.length,
    page: pageNum,
    limit: limitNum
  });
});

// BUG: Vulnerable to XSS through query params
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  
  // BUG: Reflecting user input without sanitization
  const results = articles.filter(a => 
    a.title.toLowerCase().includes(q.toLowerCase()) ||
    a.content.toLowerCase().includes(q.toLowerCase())
  );
  
  // BUG: Exposing raw query in response (XSS risk)
  res.json({
    query: q,
    results: results,
    message: `Found ${results.length} results for "${q}"`
  });
});

// BUG: No rate limiting or request size limits
app.post('/api/articles', (req, res) => {
  const { title, content, author } = req.body;
  
  // BUG: No validation of content length
  // BUG: No sanitization of HTML/script tags
  const article = {
    id: articles.length + 1,
    title,
    content,
    author,
    published: false,
    views: 0
  };
  
  articles.push(article);
  
  res.status(201).json(article);
});

// BUG: IDOR vulnerability - no authorization check
app.get('/api/articles/:id', (req, res) => {
  const id = req.params.id;
  
  // BUG: Type coercion - '1abc' becomes 1
  const article = articles.find(a => a.id == id); // Using == instead of ===
  
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  // BUG: Exposing unpublished articles
  res.json(article);
});

// BUG: Mass assignment vulnerability
app.patch('/api/articles/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const article = articles.find(a => a.id === id);
  
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  // BUG: Allows updating any field, including sensitive ones
  Object.assign(article, req.body);
  
  res.json(article);
});

// BUG: Information disclosure in error messages
app.get('/api/articles/:id/comments', (req, res) => {
  const articleId = req.params.id;
  
  try {
    // BUG: Exposing internal implementation
    const articleComments = comments.filter(c => c.articleId == articleId);
    
    res.json(articleComments);
  } catch (error) {
    // BUG: Leaking stack trace
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

// BUG: Path traversal vulnerability
app.get('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  
  // BUG: No validation - allows ../../../etc/passwd
  const filePath = `/uploads/${filename}`;
  
  res.json({ 
    message: 'File retrieved',
    path: filePath 
  });
});

// BUG: Timing attack vulnerability
app.post('/api/verify-token', (req, res) => {
  const { token } = req.body;
  const validToken = 'secret-token-12345';
  
  // BUG: String comparison is vulnerable to timing attacks
  if (token === validToken) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// BUG: Open redirect vulnerability
app.get('/api/redirect', (req, res) => {
  const { url } = req.query;
  
  // BUG: No validation - can redirect anywhere
  res.redirect(url);
});

// BUG: Cookie without secure flags
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simplified login
  if (username && password) {
    // BUG: Cookie not marked as httpOnly or secure
    res.cookie('session', 'session-token-123', {
      maxAge: 900000
      // Missing: httpOnly: true, secure: true, sameSite: 'strict'
    });
    
    res.json({ message: 'Logged in' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = app;
