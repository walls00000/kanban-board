// Frontend for the Kanban board. On load, fetches config/columns/tasks from the server and
// dynamically builds the UI. Handles task creation, deletion, inline description editing,
// and drag-and-drop reordering/column changes via SortableJS — persisting all changes to
// the server via REST calls.

// Fetch and set the board title
fetch('/config')
  .then(response => response.json())
  .then(config => {
    const title = config.title || 'Kanban Board';
    document.getElementById('boardTitle').textContent = title;
    document.getElementById('pageTitle').textContent = title;
  })
  .catch(error => console.error('Error loading config:', error));

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
      // Sort tasks by order for all columns, with fallback to id
      tasks.sort((a, b) => {
        // First sort by column to group them
        if (a.column !== b.column) {
          const columnOrder = { 'backburner': 1, 'todo': 2, 'inprogress': 3, 'done': 4 };
          return (columnOrder[a.column] || 999) - (columnOrder[b.column] || 999);
        }
        // Within the same column, sort by order if available, otherwise by id
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
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
    // Ensure proper task positioning
    setTimeout(ensureProperTaskPositioning, 100);
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
    <button class="delete-task" data-id="${task.id}">×</button>
    <div class="task-content">${task.content}</div>
    <div class="task-description" contenteditable="true" data-id="${task.id}"></div>
    <div class="task-controls">
      <!-- Future controls can go here -->
    </div>
  `;
  
  // Set description using textContent to preserve newlines
  const descriptionDiv = taskDiv.querySelector('.task-description');
  descriptionDiv.textContent = task.description || '';
  
  column.appendChild(taskDiv);
  
  // Attach delete button event
  taskDiv.querySelector('.delete-task').addEventListener('click', deleteTask);
  
  // Attach description edit events
  descriptionDiv.addEventListener('blur', updateTaskDescription);
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
  // First get current tasks to determine the new order
  fetch('/tasks')
    .then(response => response.json())
    .then(tasks => {
      const tasksInNewColumn = tasks.filter(task => task.column === newColumn);
      const maxOrder = tasksInNewColumn.length > 0 ? Math.max(...tasksInNewColumn.map(task => task.order || 0)) : 0;
      
      const updateData = { 
        column: newColumn,
        order: maxOrder + 1 // Always assign an order when moving to any column
      };
      
      return fetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
    })
    .then(response => {
      if (!response.ok) {
        console.error('Error updating task column:', response.statusText);
      }
    })
    .catch(error => {
      console.error('Network error updating task:', error);
    });
}

// Function to update task order within a column
function updateTaskOrder(columnId) {
  const column = document.getElementById(columnId);
  const tasks = Array.from(column.querySelectorAll('.task'));
  
  const updates = tasks.map((task, index) => {
    const taskId = parseInt(task.id.replace('task-', ''));
    return {
      id: taskId,
      order: index + 1
    };
  });
  
  // Send batch update to server
  fetch('/tasks/reorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ updates })
  }).then(response => {
    if (!response.ok) {
      console.error('Error updating task order:', response.statusText);
    }
  }).catch(error => {
    console.error('Network error updating task order:', error);
  });
}

// Function to update task description
function updateTaskDescription(e) {
  const taskId = e.target.getAttribute('data-id');
  
  // Convert HTML to text with preserved newlines
  // contenteditable creates <div> or <br> for newlines, we need to convert them
  let newDescription = e.target.innerHTML
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '') // Remove any other HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  
  console.log('Saving description:', JSON.stringify(newDescription));
  
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

// Function to ensure tasks are properly positioned (not nested inside other tasks)
function ensureProperTaskPositioning() {
  const allTasks = document.querySelectorAll('.task');
  allTasks.forEach(task => {
    // Check if this task is nested inside another task or inside task elements
    const parentTask = task.closest('.task:not(#' + task.id + ')');
    const parentTaskElement = task.closest('.task-description, .task-content, .task-controls');
    
    if (parentTask || parentTaskElement) {
      // This task is nested - find the correct column and move it there
      const column = (parentTask || parentTaskElement).closest('.column');
      if (column) {
        column.appendChild(task);
        console.warn('Fixed nested task:', task.id, 'moved to column:', column.id);
      }
    }
    
    // Also check if the task's direct parent is not a column
    if (task.parentElement && !task.parentElement.classList.contains('column')) {
      const column = task.closest('.column');
      if (column) {
        column.appendChild(task);
        console.warn('Fixed incorrectly nested task:', task.id);
      }
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
      
      // Only drag tasks, and only allow drops on columns
      draggable: '.task',
      
      // Prevent dropping inside task elements
      filter: 'h2, .task-description, .task-content, .task-controls, .delete-task',
      preventOnFilter: false,
      
      // Force drops to be at the column level only
      fallbackOnBody: true,
      swapThreshold: 0.65,
      
      // Prevent nested drops completely
      onMove: function(evt) {
        // Don't allow dropping inside task elements
        if (evt.related.closest('.task-description') || 
            evt.related.closest('.task-content') || 
            evt.related.closest('.task-controls')) {
          return false;
        }
        return true;
      },
      
      // Handle cases where dragging might be restricted
      onStart: function(evt) {
        // Add visual feedback
        evt.item.style.opacity = '0.8';
      },
      
      onEnd: function(evt) {
        // Restore opacity
        evt.item.style.opacity = '';
        
        // Get task element and ensure it's at column level
        const taskElement = evt.item;
        const targetColumn = evt.to;
        
        // Force the task to be a direct child of the column
        if (taskElement.parentElement !== targetColumn) {
          targetColumn.appendChild(taskElement);
        }
        
        // Ensure no tasks are nested inside other tasks
        ensureProperTaskPositioning();
        
        // Get task ID
        const taskId = taskElement.id.replace('task-', '');
        
        // Get new column
        const newColumnId = targetColumn.id;
        const oldColumnId = evt.from.id;
        
        // Update server - always call this to handle both column changes and reordering
        if (oldColumnId !== newColumnId) {
          // Moving to different column - this will assign a new order automatically
          updateTaskColumn(taskId, newColumnId);
          // Also update the order of remaining tasks in the source column
          setTimeout(() => updateTaskOrder(oldColumnId), 100);
        } else {
          // Reordering within same column - update the order
          updateTaskOrder(newColumnId);
        }
      }
    });
  });
}