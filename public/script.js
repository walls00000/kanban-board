// Fetch tasks from the server
function fetchTasks() {
  fetch('/tasks')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(tasks => {
      tasks.forEach(task => addTaskToColumn(task));
    })
    .catch(error => console.error('Error loading tasks:', error));
}

// Fetch columns from the server
fetch('/columns')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    const board = document.querySelector('.board');
    // Clear the board first, just in case
    board.innerHTML = '';
    // Dynamically create columns from the JSON
    data.columns.forEach(column => {
      const columnDiv = document.createElement('div');
      columnDiv.classList.add('column');
      columnDiv.id = column.id;
      columnDiv.innerHTML = `<h2>${column.name}</h2>`;
      board.appendChild(columnDiv);
    });
    // Initialize drag-and-drop
    initializeDragAndDrop();
    // Fetch tasks after columns are created
    fetchTasks();
  })
  .catch(error => console.error('Error loading columns:', error));

// Handle task addition
document.getElementById('taskForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const taskInput = document.getElementById('taskInput');
  const descriptionInput = document.getElementById('descriptionInput');
  const newTask = {
    id: Date.now(), // Unique ID for the task
    content: taskInput.value,
    description: descriptionInput.value,
    column: 'todo' // Default column for new tasks
  };
  // Update the tasks on the server
  fetch('/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTask)
  }).then(response => {
    if (response.ok) {
      // Add task to the UI
      addTaskToColumn(newTask);
      taskInput.value = ''; // Clear the input
      descriptionInput.value = ''; // Clear the description input
    } else {
      console.error('Error adding task:', response.statusText);
    }
  });
});

// Function to add task to the appropriate column
function addTaskToColumn(task) {
  const column = document.getElementById(task.column);
  const taskDiv = document.createElement('div');
  taskDiv.id = `task-${task.id}`;
  taskDiv.classList.add('task');
  taskDiv.draggable = true;
  taskDiv.innerHTML = `
    <div class="task-content">${task.content}</div>
    <div class="task-description" contenteditable="true" data-id="${task.id}">${task.description || ''}</div>
    <button class="delete-task" data-id="${task.id}">×</button>
  `;
  column.appendChild(taskDiv);
  
  // Attach drag-and-drop events
  taskDiv.addEventListener('dragstart', dragStart);
  taskDiv.addEventListener('dragend', dragEnd);
  
  // Attach delete button event
  taskDiv.querySelector('.delete-task').addEventListener('click', deleteTask);
  
  // Attach description edit events
  const descriptionDiv = taskDiv.querySelector('.task-description');
  descriptionDiv.addEventListener('blur', updateTaskDescription);
  descriptionDiv.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      descriptionDiv.blur();
    }
  });
  
  // Prevent dragging when editing description
  descriptionDiv.addEventListener('mousedown', function(e) {
    if (descriptionDiv.getAttribute('contenteditable') === 'true') {
      e.stopPropagation();
    }
  });
}

// Function to delete task
function deleteTask(e) {
  const taskId = e.target.getAttribute('data-id');
  // Remove task from UI
  const taskDiv = document.getElementById(`task-${taskId}`);
  taskDiv.remove();
  // Remove task from server
  fetch(`/tasks/${taskId}`, {
    method: 'DELETE'
  }).then(response => {
    if (!response.ok) {
      console.error('Error deleting task:', response.statusText);
    }
  });
}

// Drag and drop functions
function dragStart(e) {
  // Don't start dragging if user is editing description
  if (e.target.closest('.task-description[contenteditable="true"]')) {
    e.preventDefault();
    return;
  }
  e.dataTransfer.setData('text/plain', e.target.id);
}

function dragEnd(e) {
  e.preventDefault();
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text');
  const task = document.getElementById(id);
  
  // Check if the drop target is a column
  const column = e.target.closest('.column');
  if (column && task) {
    column.appendChild(task);
    
    // Update the task's column on the server
    const taskId = task.id.replace('task-', '');
    const newColumn = column.id;
    updateTaskColumn(taskId, newColumn);
  }
}

// Function to update task's column on the server
function updateTaskColumn(taskId, newColumn) {
  fetch(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ column: newColumn })
  }).then(response => {
    if (!response.ok) {
      console.error('Error updating task column:', response.statusText);
    }
  });
}

// Function to update task description
function updateTaskDescription(e) {
  const taskId = e.target.getAttribute('data-id');
  const newDescription = e.target.textContent.trim();
  
  // Update the task's description on the server
  fetch(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ description: newDescription })
  }).then(response => {
    if (!response.ok) {
      console.error('Error updating task description:', response.statusText);
    }
  });
}

// Initialize drag-and-drop
function initializeDragAndDrop() {
  const columns = document.querySelectorAll('.column');
  columns.forEach(column => {
    column.addEventListener('dragover', dragOver);
    column.addEventListener('drop', drop);
  });
}