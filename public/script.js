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
      // Sort tasks by order for todo column, by id for others (backward compatible)
      tasks.sort((a, b) => {
        if (a.column === 'todo' && b.column === 'todo') {
          return (a.order || 0) - (b.order || 0);
        }
        return a.id - b.id;
      });
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
    // Fetch tasks after columns are created
    fetchTasks();
    // Initialize SortableJS after everything is loaded
    initializeSortable();
  })
  .catch(error => console.error('Error loading columns:', error));

// Handle task addition
document.getElementById('taskForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const taskInput = document.getElementById('taskInput');
  const descriptionInput = document.getElementById('descriptionInput');
  
  // Get the current highest order for todo tasks
  fetch('/tasks')
    .then(response => response.json())
    .then(tasks => {
      const todoTasks = tasks.filter(task => task.column === 'todo');
      const maxOrder = todoTasks.length > 0 ? Math.max(...todoTasks.map(task => task.order || 0)) : 0;
      
      const newTask = {
        id: Date.now(), // Unique ID for the task
        content: taskInput.value,
        description: descriptionInput.value,
        column: 'todo', // Default column for new tasks
        order: maxOrder + 1 // Set order to be last in todo
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
    })
    .catch(error => console.error('Error fetching tasks for order calculation:', error));
});

// Function to add task to the appropriate column
function addTaskToColumn(task) {
  const column = document.getElementById(task.column);
  const taskDiv = document.createElement('div');
  taskDiv.id = `task-${task.id}`;
  taskDiv.classList.add('task');
  taskDiv.innerHTML = `
    <div class="task-content">${task.content}</div>
    <div class="task-description" contenteditable="true" data-id="${task.id}">${task.description || ''}</div>
    <div class="task-controls">
      <button class="delete-task" data-id="${task.id}">×</button>
    </div>
  `;
  column.appendChild(taskDiv);
  
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

// Function to update task's column on the server
function updateTaskColumn(taskId, newColumn) {
  const updateData = { column: newColumn };
  
  fetch(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  }).then(response => {
    if (!response.ok) {
      console.error('Error updating task column:', response.statusText);
    }
  }).catch(error => {
    console.error('Network error updating task:', error);
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

// Initialize SortableJS for drag and drop
function initializeSortable() {
  const columns = document.querySelectorAll('.column');
  
  columns.forEach(column => {
    Sortable.create(column, {
      group: 'kanban', // Allow dragging between columns
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      
      // Ignore certain elements (like the column header and buttons)
      filter: 'h2, .task-controls, .task-description[contenteditable="true"]',
      preventOnFilter: false,
      
      onEnd: function(evt) {
        // Get task ID
        const taskElement = evt.item;
        const taskId = taskElement.id.replace('task-', '');
        
        // Get new column
        const newColumnId = evt.to.id;
        
        // Only update if actually moved to different column
        if (evt.from !== evt.to) {
          // Update server
          updateTaskColumn(taskId, newColumnId);
        }
      },
      
      // Handle cases where dragging might be restricted
      onStart: function(evt) {
        // Add visual feedback
        evt.item.style.opacity = '0.8';
      },
      
      onEnd: function(evt) {
        // Restore opacity
        evt.item.style.opacity = '';
      }
    });
  });
}