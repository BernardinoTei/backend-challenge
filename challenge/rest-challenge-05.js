const express = require('express');
const app = express();

app.use(express.json());

// BUG 1: Wrong HTTP methods for operations
// BUG 2: Inconsistent response formats
// BUG 3: Missing status codes
// BUG 4: Idempotency issues
// BUG 5: Resource naming inconsistencies

// Simulated database
let tasks = [
  { id: 1, title: 'Complete project', status: 'pending', priority: 'high', assignee: 'Alice' },
  { id: 2, title: 'Review code', status: 'in-progress', priority: 'medium', assignee: 'Bob' },
  { id: 3, title: 'Write tests', status: 'completed', priority: 'high', assignee: 'Alice' }
];

let taskIdCounter = 4;

// BUG: Using POST for fetching data (should be GET)
app.post('/api/getTasks', (req, res) => {
  const { status, assignee } = req.body;
  
  let filtered = tasks;
  
  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }
  
  if (assignee) {
    filtered = filtered.filter(t => t.assignee === assignee);
  }
  
  // BUG: Inconsistent response format (no wrapper)
  res.json(filtered);
});

// BUG: Using GET for data modification (should be POST/PATCH)
app.get('/api/tasks/:id/complete', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    // BUG: Wrong status code (should be 404)
    return res.status(400).json({ error: 'Task not found' });
  }
  
  // BUG: Modifying state in GET request
  task.status = 'completed';
  
  // BUG: Inconsistent response format
  res.json({ success: true, task });
});

// BUG: POST used where PUT should be used (full replacement)
app.post('/api/updateTask/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // BUG: This is full replacement, should be PUT not POST
  tasks[taskIndex] = {
    id: taskId,
    ...req.body
  };
  
  // BUG: Missing 200 status code
  res.json({ data: tasks[taskIndex] });
});

// BUG: Not idempotent - creates duplicate tasks
app.post('/api/tasks', (req, res) => {
  const { title, status, priority, assignee } = req.body;
  
  // BUG: No validation
  // BUG: Not checking for duplicates - should be idempotent
  
  const task = {
    id: taskIdCounter++,
    title,
    status: status || 'pending',
    priority: priority || 'medium',
    assignee
  };
  
  tasks.push(task);
  
  // BUG: Wrong status code (should be 201 for creation)
  res.status(200).json(task);
});

// BUG: PATCH doesn't properly do partial updates
app.patch('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // BUG: This replaces the entire object, not a partial update
  Object.keys(req.body).forEach(key => {
    task[key] = req.body[key];
  });
  
  // BUG: Allows modifying ID
  if (req.body.id) {
    task.id = req.body.id;
  }
  
  res.json({ task });
});

// BUG: DELETE not idempotent - returns different status codes
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    // BUG: Should return 404, but returns 400
    return res.status(400).json({ error: 'Cannot delete non-existent task' });
  }
  
  tasks.splice(taskIndex, 1);
  
  // BUG: Returning deleted content instead of 204 No Content
  res.json({ message: 'Task deleted', deletedTask: tasks[taskIndex] });
});

// BUG: Inconsistent URL naming (plural vs singular)
app.get('/api/task/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // BUG: Different response format than list endpoint
  res.json({ data: { task } });
});

// BUG: Nested resource without proper REST structure
app.post('/api/tasks/:id/assign', (req, res) => {
  const { assignee } = req.body;
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  task.assignee = assignee;
  
  // BUG: Should return 200, returns 201
  res.status(201).json(task);
});

// BUG: Using PUT for partial update (should be PATCH)
app.put('/api/tasks/:id/priority', (req, res) => {
  const { priority } = req.body;
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // BUG: Only updating one field but using PUT
  task.priority = priority;
  
  res.json({ task });
});

// BUG: Bulk operations with wrong method and inconsistent behavior
app.post('/api/tasks/deleteMultiple', (req, res) => {
  const { ids } = req.body;
  
  // BUG: Should validate ids
  // BUG: Should use proper HTTP method
  
  const deleted = [];
  ids.forEach(id => {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      deleted.push(tasks[index]);
      tasks.splice(index, 1);
    }
  });
  
  // BUG: Inconsistent response format
  res.json({ 
    success: true,
    deletedCount: deleted.length,
    deleted: deleted
  });
});

// BUG: Action endpoint that should be a state change
app.post('/api/tasks/:id/archive', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // BUG: This is just a status change, should be a PATCH to status field
  task.status = 'archived';
  
  res.json({ message: 'Task archived', task });
});

// BUG: Filtering in POST body instead of query params
app.post('/api/tasks/filter', (req, res) => {
  const { priority, status, assignee } = req.body;
  
  let filtered = tasks;
  
  if (priority) {
    filtered = filtered.filter(t => t.priority === priority);
  }
  
  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }
  
  if (assignee) {
    filtered = filtered.filter(t => t.assignee === assignee);
  }
  
  // BUG: Using POST for read operation
  res.json(filtered);
});

module.exports = app;
