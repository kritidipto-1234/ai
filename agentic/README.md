# Todo Database Agent

An AI-powered todo list assistant built with MCP (Model Context Protocol) and Google's Gemini AI.

## Features

- **Natural Language Interface**: Chat with your todo list using natural language
- **Persistent Storage**: SQLite database for reliable todo storage
- **Smart Date Handling**: AI assistant ensures every todo has a due date
- **Full CRUD Operations**: Create, read, search, and delete todos
- **Beautiful CLI Interface**: Clean and user-friendly command line experience

## Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **Google Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up your Gemini API Key**:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```

3. **Build the project**:
   ```bash
   pnpm run build
   ```

## Usage

### Start the Todo Agent
```bash
pnpm run start
```

### Development Mode (build + run)
```bash
pnpm run dev
```

### Example Interactions

```
You: Add a new todo to buy groceries
🤖 Assistant: I'd be happy to help you add that todo! However, I need to know when you'd like to complete this task. What's the due date for buying groceries? Please provide it in YYYY-MM-DD format.

You: 2024-01-15
🤖 Assistant: [Calling tool create-todo with args {"task":"buy groceries","dueDate":"2024-01-15"}]
Perfect! I've successfully created your todo:
- Task: buy groceries  
- Due Date: 2024-01-15
Your todo has been saved with ID: 1

You: Show me all my todos
🤖 Assistant: [Calling tool get-all-todos with args {}]
Here are all your todos:

ID: 1
Task: buy groceries
Due Date: 2024-01-15
Created: 2024-01-10 10:30:00
---

You: Delete todo 1
🤖 Assistant: [Calling tool delete-todo with args {"id":1}]
Done! I've successfully deleted the todo with ID 1 (buy groceries). Your todo list has been updated.
```

## Available Commands

The AI assistant can handle these types of requests:

- **Add todos**: "Add a new todo", "Create a task", "I need to remember to..."
- **View todos**: "Show all todos", "List my tasks", "What do I have to do?"
- **Search todos**: "Find todos about groceries", "Search for work tasks"
- **Delete todos**: "Delete todo 1", "Remove the grocery task"
- **Exit**: "exit" or "quit"

## Architecture

- **Agent** (`src/agent/index.ts`): Main chat loop and user interface
- **MCP Client** (`src/mcp/client.ts`): Handles communication with MCP servers and Gemini AI
- **Todo Server** (`src/mcp/servers/todo/index.ts`): MCP server with todo management tools
- **Database** (`src/mcp/servers/todo/db.ts`): SQLite database operations

## Scripts

- `pnpm run build` - Build TypeScript to JavaScript
- `pnpm run start` - Run the todo agent
- `pnpm run dev` - Build and run in one command
- `pnpm run todo-server` - Run just the todo server (for debugging)
- `pnpm run inspect` - Inspect the todo server with MCP inspector

## Database

The app creates a `todos.db` SQLite file in the project root to store your todos persistently.

## Troubleshooting

1. **"GEMINI_API_KEY environment variable is required"**
   - Make sure you've exported your Gemini API key: `export GEMINI_API_KEY="your_key"`

2. **Build errors**
   - Run `pnpm install` to ensure all dependencies are installed
   - Check that you're using Node.js v18 or higher

3. **Connection issues**
   - The todo server runs automatically when you start the agent
   - Make sure no other process is using the same ports

## Contributing

Feel free to submit issues and enhancement requests!
