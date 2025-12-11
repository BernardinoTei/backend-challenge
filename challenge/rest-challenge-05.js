const express = require('express');
const app = express();

app.use(express.json());


let tasks = [
  { id: 1, title: 'Complete project', status: 'pending', priority: 'high', assignee: 'Alice' },
  { id: 2, title: 'Review code', status: 'in-progress', priority: 'medium', assignee: 'Bob' },
  { id: 3, title: 'Write tests', status: 'completed', priority: 'high', assignee: 'Alice' }
];

let taskIdCounter = 4;


app.post('/api/getTasks', (req, res) => {
  const { status, assignee } = req.body;
  
  let filtered = tasks;
  
  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }
  
  if (assignee) {
    filtered = filtered.filter(t => t.assignee === assignee);
  }
  

  res.json(filtered);
});


app.get('/api/tasks/:id/complete', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {

    return res.status(400).json({ error: 'Task not found' });
  }
  

  task.status = 'completed';
  

  res.json({ success: true, task });
});


app.post('/api/updateTask/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  

  tasks[taskIndex] = {
    id: taskId,
    ...req.body
  };
  

  res.json({ data: tasks[taskIndex] });
});


app.post('/api/tasks', (req, res) => {
  const { title, status, priority, assignee } = req.body;
  

  
  const task = {
    id: taskIdCounter++,
    title,
    status: status || 'pending',
    priority: priority || 'medium',
    assignee
  };
  
  tasks.push(task);
  

  res.status(200).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  

  Object.keys(req.body).forEach(key => {
    task[key] = req.body[key];
  });
  

  if (req.body.id) {
    task.id = req.body.id;
  }
  
  res.json({ task });
});


app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {

    return res.status(400).json({ error: 'Cannot delete non-existent task' });
  }
  
  tasks.splice(taskIndex, 1);
  

  res.json({ message: 'Task deleted', deletedTask: tasks[taskIndex] });
});


app.get('/api/task/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  

  res.json({ data: { task } });
});


app.post('/api/tasks/:id/assign', (req, res) => {
  const { assignee } = req.body;
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  task.assignee = assignee;
  

  res.status(201).json(task);
});


app.put('/api/tasks/:id/priority', (req, res) => {
  const { priority } = req.body;
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  

  task.priority = priority;
  
  res.json({ task });
});


app.post('/api/tasks/deleteMultiple', (req, res) => {
  const { ids } = req.body;
  

  
  const deleted = [];
  ids.forEach(id => {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      deleted.push(tasks[index]);
      tasks.splice(index, 1);
    }
  });

  res.json({ 
    success: true,
    deletedCount: deleted.length,
    deleted: deleted
  });
});


app.post('/api/tasks/:id/archive', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  

  task.status = 'archived';
  
  res.json({ message: 'Task archived', task });
});


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
  
 
  res.json(filtered);
});

module.exports = app;
