#!/bin/bash

# Get current date in YYYY-MM-DD format
DATESTAMP=$(date +%Y-%m-%d)

# Export in-progress tasks to bullet format
./view.js inprogress --output bullet > inprogress.txt

# Export done tasks to bullet format
./view.js done --output bullet > done.txt

# Backup tasks.json with datestamp
cp tasks.json tasks.${DATESTAMP}.json

echo "Tasks exported successfully:"
echo "- inprogress.txt ($(wc -l < inprogress.txt) lines)"
echo "- done.txt ($(wc -l < done.txt) lines)"
echo "- tasks.${DATESTAMP}.json (backup created)"
