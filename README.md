# Todo Application

A command-line Todo application that stores tasks in memory with full CRUD functionality.

## Overview

This is a simple yet complete command-line todo application built with Python. It provides all basic todo operations:
- Add tasks with title and description
- List all tasks with unique ID and completion status
- Update task title and description by ID
- Delete tasks by ID
- Toggle task completion state by ID

## Features

- In-memory storage (no files or databases)
- Clean command-line interface
- Full CRUD operations
- Task completion tracking
- Creation and update timestamps

## Prerequisites

- Python 3.13 or higher
- UV package manager (optional but recommended)

## Installation

1. Clone or download this repository
2. Navigate to the project directory
3. The application is ready to run (no external dependencies)

## Usage

Run the application:
```bash
python run.py
```

Once the application is running, you'll see a `todo>` prompt. Here are the available commands:

### Available Commands

- `add <title> [description]` - Add a new task (use quotes for titles/descriptions with spaces)
- `list` - List all tasks
- `view <id>` - View a specific task
- `update <id> <title> [description]` - Update a task (use quotes for titles/descriptions with spaces)
- `delete <id>` - Delete a task
- `complete <id>` - Mark task as completed
- `incomplete <id>` - Mark task as incomplete
- `toggle <id>` - Toggle task completion status
- `help` - Show help information
- `quit` or `exit` - Exit the application

### Example Usage

```
todo> add "Buy groceries" "Milk, bread, eggs"
todo> add "Finish report" "Complete the quarterly report"
todo> list
todo> complete 1
todo> update 2 "Finish quarterly report" "Complete and submit the quarterly report"
todo> delete 1
todo> quit
```

## Project Structure

```
.
├── src/
│   └── todo_app.py          # Main application code with Task model, TodoApp service, and TodoCLI
├── run.py                  # Application entry point
├── README.md               # This file
├── CLAUDE.md               # Claude Code rules
├── plan.md                 # Implementation plan
└── tasks.md                # Implementation tasks
```

## Architecture

The application follows a clean separation of concerns:

- `Task` class: Represents a single todo task with ID, title, description, completion status, and timestamps
- `TodoApp` class: Handles business logic and in-memory storage
- `TodoCLI` class: Provides command-line interface and user interaction
- Main function: Entry point for the application

## Design Decisions

- **In-memory storage**: Uses Python dictionaries for fast access without external dependencies
- **Type hints**: Full type annotations for better code clarity
- **Error handling**: Proper validation and error messages
- **Timestamps**: Tracks creation and update times for tasks
- **Clean CLI**: Intuitive command structure with helpful feedback

## Limitations

- Data is not persisted between application runs
- Single-user application
- No authentication or multi-user support
- Console-only interface

## Testing

To test the application, simply run it and try the various commands:

1. Add several tasks with different titles and descriptions
2. List all tasks to verify they're stored correctly
3. View specific tasks to see detailed information
4. Update tasks to modify their content
5. Mark tasks as complete/incomplete to test state changes
6. Delete tasks to verify removal from the list
7. Exit and restart to confirm in-memory behavior

## Next Steps

This application serves as the foundation for Phase II, where it will be extended with:
- Persistent storage (database)
- Web interface (Next.js frontend)
- API endpoints (FastAPI backend)
- Multi-user support