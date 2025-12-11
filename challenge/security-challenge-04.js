const express = require('express');
const cors = require('cors');

const app = express();



app.use(express.json());


app.use(cors({
  origin: '*', 
  credentials: true 
}));


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


app.get('/api/articles', (req, res) => {
  const { author, published, minViews, sort, limit, page } = req.query;
  
  let filtered = [...articles];
  

  if (published) {

    filtered = filtered.filter(a => a.published === published);
  }
  
  if (author) {
    filtered = filtered.filter(a => a.author === author);
  }
  

  if (minViews) {
    filtered = filtered.filter(a => a.views >= minViews);
  }
  
 
  if (sort) {

    filtered.sort((a, b) => {
    
      return eval(`a.${sort} - b.${sort}`);
    });
  }
  

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


app.get('/api/search', (req, res) => {
  const { q } = req.query;
  

  const results = articles.filter(a => 
    a.title.toLowerCase().includes(q.toLowerCase()) ||
    a.content.toLowerCase().includes(q.toLowerCase())
  );
  

  res.json({
    query: q,
    results: results,
    message: `Found ${results.length} results for "${q}"`
  });
});


app.post('/api/articles', (req, res) => {
  const { title, content, author } = req.body;
  

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


app.get('/api/articles/:id', (req, res) => {
  const id = req.params.id;
  

  const article = articles.find(a => a.id == id);
  
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  

  res.json(article);
});


app.patch('/api/articles/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const article = articles.find(a => a.id === id);
  
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  

  Object.assign(article, req.body);
  
  res.json(article);
});


app.get('/api/articles/:id/comments', (req, res) => {
  const articleId = req.params.id;
  
  try {
   
    const articleComments = comments.filter(c => c.articleId == articleId);
    
    res.json(articleComments);
  } catch (error) {

    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});


app.get('/api/files/:filename', (req, res) => {
  const { filename } = req.params;

  const filePath = `/uploads/${filename}`;
  
  res.json({ 
    message: 'File retrieved',
    path: filePath 
  });
});


app.post('/api/verify-token', (req, res) => {
  const { token } = req.body;
  const validToken = 'secret-token-12345';
  

  if (token === validToken) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});


app.get('/api/redirect', (req, res) => {
  const { url } = req.query;
  

  res.redirect(url);
});


app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  

  if (username && password) {

    res.cookie('session', 'session-token-123', {
      maxAge: 900000
    });
    
    res.json({ message: 'Logged in' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = app;
