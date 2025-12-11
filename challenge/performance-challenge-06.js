const express = require('express');
const app = express();

app.use(express.json());

// BUG 1: Memory leak - growing arrays never cleaned
// BUG 2: N+1 query problem in related data fetching
// BUG 3: No caching of expensive operations
// BUG 4: Synchronous blocking operations
// BUG 5: Inefficient algorithms

// Simulated databases
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

// BUG: Memory leak - request logs never cleared
const requestLogs = [];

// Logging middleware
app.use((req, res, next) => {
  // BUG: Array grows indefinitely
  requestLogs.push({
    timestamp: new Date(),
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  // BUG: Never cleaned up!
  console.log(`Total requests: ${requestLogs.length}`);
  next();
});

// Simulate database delay
function simulateDbQuery(ms = 50) {
  const start = Date.now();
  // BUG: Blocking synchronous delay
  while (Date.now() - start < ms) {
    // Busy wait - blocks event loop!
  }
}

// BUG: N+1 query problem
app.get('/api/posts', (req, res) => {
  simulateDbQuery(10);
  
  // Fetch all posts
  const allPosts = [...posts];
  
  // BUG: For each post, fetch author separately (N+1)
  const postsWithAuthors = allPosts.map(post => {
    simulateDbQuery(5); // Separate query for each post!
    const author = users.find(u => u.id === post.authorId);
    
    return {
      ...post,
      author: author ? author.name : 'Unknown'
    };
  });
  
  res.json({ posts: postsWithAuthors });
});

// BUG: Nested N+1 queries
app.get('/api/users/:id/activity', (req, res) => {
  const userId = parseInt(req.params.id);
  
  simulateDbQuery(10);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // BUG: N+1 - fetching posts one by one
  const userPosts = [];
  posts.forEach(post => {
    simulateDbQuery(5);
    if (post.authorId === userId) {
      // BUG: Another N+1 - fetching comments for each post
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

// BUG: No caching of expensive computation
app.get('/api/statistics', (req, res) => {
  // BUG: Recalculated on every request
  simulateDbQuery(100); // Expensive operation
  
  const stats = {
    totalPosts: posts.length,
    totalComments: comments.length,
    totalUsers: users.length,
    avgPostsPerUser: posts.length / users.length,
    avgCommentsPerPost: comments.length / posts.length,
    // BUG: Inefficient calculation
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

// BUG: Inefficient sorting and filtering
app.get('/api/posts/popular', (req, res) => {
  const { minLikes = 0 } = req.query;
  
  // BUG: Sorting entire array when we only need top 10
  const sortedPosts = [...posts].sort((a, b) => b.likes - a.likes);
  
  // BUG: Filtering after sorting (should filter first)
  const filtered = sortedPosts.filter(p => p.likes >= parseInt(minLikes));
  
  // BUG: Then slicing (could have done this earlier)
  const top10 = filtered.slice(0, 10);
  
  // BUG: Another N+1 for author names
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

// BUG: Loading entire dataset into memory
app.get('/api/comments', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  simulateDbQuery(20);
  
  // BUG: Loading all comments first (memory intensive)
  const allComments = [...comments];
  
  // BUG: Adding author to every comment (N+1)
  const withAuthors = allComments.map(comment => {
    simulateDbQuery(2);
    const author = users.find(u => u.id === comment.authorId);
    return {
      ...comment,
      author: author ? author.name : 'Unknown'
    };
  });
  
  // BUG: Paginating after all processing
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

// BUG: Expensive regex operation on every request
app.get('/api/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }
  
  // BUG: Creating regex on every search (could be cached)
  // BUG: No escaping of special regex characters
  const regex = new RegExp(query, 'i');
  
  // BUG: Searching through all data sequentially
  const matchingPosts = posts.filter(post => {
    simulateDbQuery(3); // Simulate slow search
    return regex.test(post.title) || regex.test(post.content);
  });
  
  res.json({ results: matchingPosts });
});

// BUG: Circular reference in response
app.get('/api/departments', (req, res) => {
  simulateDbQuery(10);
  
  const deptWithUsers = departments.map(dept => {
    simulateDbQuery(5);
    const deptUsers = users.filter(u => u.departmentId === dept.id);
    
    return {
      ...dept,
      users: deptUsers.map(user => {
        // BUG: Creating circular reference
        return {
          ...user,
          department: dept // Circular!
        };
      })
    };
  });
  
  res.json({ departments: deptWithUsers });
});

// BUG: Accumulating data in closure
let cachedData = [];

app.get('/api/analytics', (req, res) => {
  simulateDbQuery(50);
  
  // BUG: Data accumulates, never cleared
  cachedData.push({
    timestamp: Date.now(),
    userCount: users.length,
    postCount: posts.length
  });
  
  // BUG: Analyzing all historical data on every request
  const analytics = {
    current: cachedData[cachedData.length - 1],
    history: cachedData,
    trend: cachedData.length > 1 
      ? cachedData[cachedData.length - 1].postCount - cachedData[0].postCount
      : 0
  };
  
  res.json(analytics);
});

// BUG: No connection pooling simulation
const connections = [];

app.get('/api/health', (req, res) => {
  // BUG: Creating new "connection" on every request
  const connection = {
    id: Date.now(),
    created: new Date()
  };
  
  connections.push(connection);
  
  // BUG: Never closing connections
  res.json({
    status: 'ok',
    activeConnections: connections.length
  });
});

module.exports = app;
