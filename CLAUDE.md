# Kanban Board

A lightweight, self-hosted task management app with a browser UI and CLI tools. No database — tasks persist to local JSON files. Based on [sctech-tr/kanban](https://github.com/sctech-tr/kanban), extended with editable descriptions and CLI utilities.

## Tech Stack

- **Backend**: Node.js + Express (serves static files and a REST API)
- **Frontend**: Vanilla JS, HTML, CSS — no framework
- **Drag-and-drop**: SortableJS via CDN
- **Persistence**: JSON files on disk (`tasks.json`, `columns.json`, `config.json`)
- **Dev server**: Nodemon

## Project Structure

```
server.js           # Express backend — REST API + static file serving
public/
  index.html        # Main page
  script.js         # All frontend logic (drag-drop, inline editing, API calls)
  style.css         # Styling
view.js             # CLI tool — view tasks from the terminal
export-tasks.sh     # Shell script — export tasks to text + create dated backups
tasks.json          # Live task data
columns.json        # Column configuration (names, order)
config.json         # Board title
tasks.init.json     # Empty task file (used by start:fresh)
```

## Running the App

```bash
npm install

npm run dev           # Dev server with auto-reload (nodemon)
npm run start         # Production start (node server.js)
npm run start:fresh   # Start with a clean, empty task list
```

Open `http://localhost:3000` in the browser.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | All tasks |
| POST | `/tasks` | Create task |
| PATCH | `/tasks/:id` | Update task (column, description, order) |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/tasks/reorder` | Batch reorder tasks |
| GET | `/columns` | Column config |
| GET | `/config` | Board config (title) |

## CLI Tools

```bash
npm run view                              # Show done tasks (JSON)
npm run view inprogress                   # Show in-progress tasks
npm run view todo --output bullet         # Bullet-list format
npm run view done tasks.2025-01-01.json   # View a backup file

./export-tasks.sh   # Export to inprogress.txt / done.txt + create dated backup
```

## Data Model

Each task in `tasks.json`:
```json
{
  "id": 1700000000000,    // Date.now() timestamp
  "content": "Task title",
  "description": "Optional details...",
  "column": "todo",       // todo | inprogress | done
  "order": 3
}
```

## No Tests

There is no test suite. Verify changes by running the app and testing in the browser.
