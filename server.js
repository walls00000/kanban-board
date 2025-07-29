const fs = require('fs');
const express = require('express');
const app = express();

app.use(express.json());

app.get('/tasks', (req, res) => {
  const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
  res.json(tasks);
});

app.get('/columns', (req, res) => {
  const columns = JSON.parse(fs.readFileSync('columns.json', 'utf8'));
  res.json(columns);
});

// Handle POST request for adding new tasks
app.post('/tasks', (req, res) => {
  const newTask = req.body;
  
  // Read existing tasks
  const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
  
  // Add the new task
  tasks.push(newTask);
  
  // Save updated tasks to tasks.json
  fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));
  res.sendStatus(200);
});

// Handle DELETE request for deleting tasks
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  
  // Read existing tasks
  const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));

  // Remove task from tasks
  const updatedTasks = tasks.filter(task => task.id !== taskId);
  
  // Save updated tasks to tasks.json
  fs.writeFileSync('tasks.json', JSON.stringify(updatedTasks, null, 2));
  res.sendStatus(200);
});

app.patch('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const updates = req.body; // This can contain column, description, order, or other fields
  
  // Read existing tasks
  const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
  
  // Find and update the task
  const task = tasks.find(task => task.id === taskId);
  if (task) {
    // Update any provided fields
    if (updates.column !== undefined) {
      task.column = updates.column;
    }
    if (updates.description !== undefined) {
      task.description = updates.description;
    }
    if (updates.content !== undefined) {
      task.content = updates.content;
    }
    if (updates.order !== undefined) {
      if (updates.order === null) {
        delete task.order; // Remove order field entirely when null
      } else {
        task.order = updates.order;
      }
    }
    
    // Save updated tasks to tasks.json
    fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));
    res.sendStatus(200);
  } else {
    res.status(404).send('Task not found');
  }
});

// Endpoint to reorder multiple tasks
app.post('/tasks/reorder', (req, res) => {
  const { updates } = req.body; // Array of {id, order} objects
  
  if (!Array.isArray(updates)) {
    return res.status(400).send('updates must be an array');
  }
  
  // Read existing tasks
  const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
  
  // Update order for each task
  updates.forEach(update => {
    const task = tasks.find(t => t.id === update.id);
    if (task) {
      task.order = update.order;
    }
  });
  
  // Save updated tasks to tasks.json
  fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));
  res.sendStatus(200);
});

app.use(express.static('public'));

app.listen(3000, () => console.log('Kanban board running on http://localhost:3000'));