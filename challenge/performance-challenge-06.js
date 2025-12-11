const express = require('express');
const app = express();

app.use(express.json());


const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', departmentId: 1 },
  { id: 2, name: 'Bob', email: 'bob@example.com', departmentId: 1 },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', departmentId: 2 }
];

const departments = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Marketing' }
];

const posts = [];
for (let i = 1; i <= 100; i++) {
  posts.push({
    id: i,
    title: `Post ${i}`,
    content: `Content for post ${i}`,
    authorId: (i % 3) + 1,
    likes: Math.floor(Math.random() * 100)
  });
}

const comments = [];
for (let i = 1; i <= 500; i++) {
  comments.push({
    id: i,
    postId: (i % 100) + 1,
    authorId: (i % 3) + 1,
    text: `Comment ${i}`
  });
}


const requestLogs = [];


app.use((req, res, next) => {

  requestLogs.push({
    timestamp: new Date(),
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  

  console.log(`Total requests: ${requestLogs.length}`);
  next();
});


function simulateDbQuery(ms = 50) {
  const start = Date.now();

  while (Date.now() - start < ms) {

  }
}


app.get('/api/posts', (req, res) => {
  simulateDbQuery(10);
  

  const allPosts = [...posts];
  

  const postsWithAuthors = allPosts.map(post => {
    simulateDbQuery(5); 
    const author = users.find(u => u.id === post.authorId);
    
    return {
      ...post,
      author: author ? author.name : 'Unknown'
    };
  });
  
  res.json({ posts: postsWithAuthors });
});


app.get('/api/users/:id/activity', (req, res) => {
  const userId = parseInt(req.params.id);
  
  simulateDbQuery(10);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  

  const userPosts = [];
  posts.forEach(post => {
    simulateDbQuery(5);
    if (post.authorId === userId) {
     
      const postComments = [];
      comments.forEach(comment => {
        simulateDbQuery(2);
        if (comment.postId === post.id) {
          postComments.push(comment);
        }
      });
      
      userPosts.push({
        ...post,
        commentCount: postComments.length
      });
    }
  });
  
  res.json({
    user,
    posts: userPosts
  });
});


app.get('/api/statistics', (req, res) => {
  
  simulateDbQuery(100);
  
  const stats = {
    totalPosts: posts.length,
    totalComments: comments.length,
    totalUsers: users.length,
    avgPostsPerUser: posts.length / users.length,
    avgCommentsPerPost: comments.length / posts.length,
   
    topAuthors: posts.reduce((acc, post) => {
      const existing = acc.find(a => a.authorId === post.authorId);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ authorId: post.authorId, count: 1 });
      }
      return acc;
    }, []).sort((a, b) => b.count - a.count)
  };
  
  res.json(stats);
});


app.get('/api/posts/popular', (req, res) => {
  const { minLikes = 0 } = req.query;
  

  const sortedPosts = [...posts].sort((a, b) => b.likes - a.likes);

  const filtered = sortedPosts.filter(p => p.likes >= parseInt(minLikes));
  

  const top10 = filtered.slice(0, 10);
  

  const withAuthors = top10.map(post => {
    simulateDbQuery(5);
    const author = users.find(u => u.id === post.authorId);
    return {
      ...post,
      author: author ? author.name : 'Unknown'
    };
  });
  
  res.json({ posts: withAuthors });
});


app.get('/api/comments', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  simulateDbQuery(20);
  

  const allComments = [...comments];
  

  const withAuthors = allComments.map(comment => {
    simulateDbQuery(2);
    const author = users.find(u => u.id === comment.authorId);
    return {
      ...comment,
      author: author ? author.name : 'Unknown'
    };
  });
  

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = withAuthors.slice(startIndex, startIndex + limitNum);
  
  res.json({
    comments: paginated,
    total: withAuthors.length,
    page: pageNum
  });
});


app.get('/api/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }
  

  const regex = new RegExp(query, 'i');
  

  const matchingPosts = posts.filter(post => {
    simulateDbQuery(3); 
    return regex.test(post.title) || regex.test(post.content);
  });
  
  res.json({ results: matchingPosts });
});


app.get('/api/departments', (req, res) => {
  simulateDbQuery(10);
  
  const deptWithUsers = departments.map(dept => {
    simulateDbQuery(5);
    const deptUsers = users.filter(u => u.departmentId === dept.id);
    
    return {
      ...dept,
      users: deptUsers.map(user => {
     
        return {
          ...user,
          department: dept 
        };
      })
    };
  });
  
  res.json({ departments: deptWithUsers });
});


let cachedData = [];

app.get('/api/analytics', (req, res) => {
  simulateDbQuery(50);
  

  cachedData.push({
    timestamp: Date.now(),
    userCount: users.length,
    postCount: posts.length
  });
  

  const analytics = {
    current: cachedData[cachedData.length - 1],
    history: cachedData,
    trend: cachedData.length > 1 
      ? cachedData[cachedData.length - 1].postCount - cachedData[0].postCount
      : 0
  };
  
  res.json(analytics);
});


const connections = [];

app.get('/api/health', (req, res) => {

  const connection = {
    id: Date.now(),
    created: new Date()
  };
  
  connections.push(connection);
  
 
  res.json({
    status: 'ok',
    activeConnections: connections.length
  });
});

module.exports = app;
