# Kanban Board

**Based on [sctech-tr/kanban](https://github.com/sctech-tr/kanban)** - Enhanced with editable descriptions and CLI tools.


A lightweight, self-hosted Kanban board built with plain HTML, CSS, and JavaScript, with a minimal backend using Node.js and Express for task storage. Enhanced with editable task descriptions and CLI tools for task management.

## Features

- Drag-and-drop tasks between columns: To Do, In Progress, Done
- Editable task descriptions: Click on any task description to edit it inline
- Task Deletion: Each task has a delete button that allows you to remove it from the board and server
- CLI tool for viewing tasks from the command line
- No database needed: task data is stored in a simple JSON file
- Lightweight and easy to set up

## Installation

### Prerequisites

- Node.js: Make sure you have Node.js installed on your machine. If not, you can download it from [here](https://nodejs.org).
- Git: You'll also need [Git](https://git-scm.com) to clone the repository.

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/william-wallace/kanban-board.git
   cd kanban-board
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the server:
   ```bash
   echo "[]" > tasks.json ; node server.js
   ```
   or
   ```
   npm run start:fresh
   ```
   Once a `task.json` is established, the kanban service can be started with 
   ```
   node server.js 
   ```
   or
   ```
   npm run start
   ```

4. Access the board: Open your browser and go to:
   ```
   http://localhost:3000
   ```

5. Congrats! You should now see the Kanban board running locally on your machine.

## Usage

- Drag and drop tasks between the columns.
- The tasks will be saved in a `tasks.json` file in the root folder of the project. This file stores the current state of the board.

## Adding Tasks

Use the task addition form to add tasks. Each task can have a title and an optional description. The description field is editable directly on the board - simply click on the description area of any task to edit it.

Alternatively, update the `tasks.json` file manually to pre-load tasks.

## Viewing Tasks from Command Line

The project includes a CLI tool to view tasks from the command line. This is useful for quickly checking task status or integrating with other tools.

### Usage

```bash
npm run view [column] [json-file]
```

**Parameters:**
- `column` (optional): The column to filter by. Valid values are `todo`, `inprogress`, or `done`. Defaults to `done`.
- `json-file` (optional): Path to the JSON file to read. Defaults to `./tasks.json`.

### Examples

View all completed tasks (default):
```bash
npm run view
```

View tasks in progress:
```bash
npm run view inprogress
```

View todo tasks:
```bash
npm run view todo
```

View tasks from a specific file:
```bash
npm run view done ./my-tasks.json
```

The output shows only the content and description fields of matching tasks in JSON format, making it easy to parse or integrate with other tools.

## Customization

You can easily modify the layout or styles by editing the `index.html` and `style.css` files in the public folder.

## Adding/Editing Columns

To customize the columns on your Kanban board, you can modify the `columns.json` file. Here's an example structure:

```json
{
  "columns": [
    { "id": "todo", "name": "To Do" },
    { "id": "inprogress", "name": "In Progress" },
    { "id": "done", "name": "Done" }
  ]
}
```

You can add or remove columns by editing this file, and the changes will be reflected when you refresh the page.

## Running on Machine Startup

To run this application on startup, you can use a process manager like `pm2`.

1. Install pm2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the application with pm2:
   ```bash
   pm2 start server.js --name "sctech-kanban"
   ```

3. Set pm2 to start on boot:
   ```bash
   pm2 startup
   pm2 save
   ```

Now your Kanban board will start automatically whenever your machine boots up.

## Contributing

Feel free to submit issues or pull requests to improve the project.

Happy working! 😊