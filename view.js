#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Usage function
function showUsage() {
    console.log(`
Usage: view.js [column] [jsonFile] [--output format] [--help]

Arguments:
  column      Column to filter tasks by (default: done)
              Valid values: todo, inprogress, done
  
  jsonFile    Path to the JSON tasks file (default: ./tasks.json)

Options:
  --output    Output format (default: json)
              Valid values: json, bullet
              
              json:   Output as JSON array
              bullet: Output as bullet list with descriptions indented
  
  --help      Show this usage information

Examples:
  view.js                                    # Show done tasks as JSON
  view.js todo                              # Show todo tasks as JSON
  view.js done tasks.2025-07-11.json       # Show done tasks from specific file
  view.js inprogress --output bullet        # Show in-progress tasks as bullet list
  view.js todo tasks.json --output json     # Explicit JSON output
`);
}

// Parse command line arguments
const args = process.argv.slice(2);

// Check for --help flag
if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
}

// Parse --output flag
let outputFormat = 'json'; // default
const outputIndex = args.findIndex(arg => arg === '--output');
if (outputIndex !== -1 && outputIndex + 1 < args.length) {
    outputFormat = args[outputIndex + 1];
    // Remove --output and its value from args
    args.splice(outputIndex, 2);
}

const column = args[0] || 'done';
const jsonFile = args[1] || './tasks.json';

// Validate column input
const validColumns = ['todo', 'inprogress', 'done'];
if (!validColumns.includes(column)) {
    console.error(`Error: Invalid column "${column}". Valid columns are: ${validColumns.join(', ')}`);
    process.exit(1);
}

// Validate output format
const validOutputs = ['json', 'bullet'];
if (!validOutputs.includes(outputFormat)) {
    console.error(`Error: Invalid output format "${outputFormat}". Valid formats are: ${validOutputs.join(', ')}`);
    process.exit(1);
}

// Read and parse the JSON file
try {
    const filePath = path.resolve(jsonFile);
    
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File "${jsonFile}" does not exist.`);
        process.exit(1);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Filter tasks by column
    const filteredTasks = data.filter(task => task.column === column);
    
    // Sort tasks by order field for todo column, by id for others (backward compatible)
    filteredTasks.sort((a, b) => {
        if (column === 'todo') {
            return (a.order || 0) - (b.order || 0);
        }
        return a.id - b.id;
    });
    
    // Extract only content and description fields
    const outputTasks = filteredTasks.map(task => ({
        content: task.content,
        description: task.description
    }));
    
    // Output in requested format
    if (outputFormat === 'bullet') {
        outputTasks.forEach(task => {
            console.log(`* ${task.content}`);
            if (task.description && task.description.trim() !== '') {
                console.log(`    - ${task.description}`);
            }
        });
    } else {
        // Default JSON output
        console.log(JSON.stringify(outputTasks, null, 2));
    }
    
} catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`Error: File "${jsonFile}" not found.`);
    } else if (error instanceof SyntaxError) {
        console.error(`Error: Invalid JSON in file "${jsonFile}".`);
    } else {
        console.error(`Error: ${error.message}`);
    }
    process.exit(1);
}
