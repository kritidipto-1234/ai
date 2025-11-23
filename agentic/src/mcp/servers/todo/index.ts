import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TodoDatabase } from "./db.js";

// Create database instance
const todoDb = new TodoDatabase();

// Create server instance
const server = new McpServer({
  name: "todo",
  version: "1.0.0",
});

// Tool to get all todos
server.tool(
  "get-all-todos",
  "Get all todos from the database",
  {},
  async () => {
    try {
      const todos = await todoDb.getAllTodos();
      
      if (todos.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No todos found in the database.",
            },
          ],
        };
      }

      const formattedTodos = todos.map(todo => 
        `ID: ${todo.id}\nTask: ${todo.task}\nDue Date: ${todo.due_date || 'Not set'}\nCreated: ${todo.created_at}\n---`
      ).join('\n');

      return {
        content: [
          {
            type: "text",
            text: `Found ${todos.length} todo(s):\n\n${formattedTodos}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving todos: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Tool to create a new todo
server.tool(
  "create-todo",
  "Create a new todo item",
  {
    task: z.string().describe("The task description"),
    dueDate: z.string().optional().describe("Optional due date for the task (YYYY-MM-DD format)"),
  },
  async (args) => {
    try {
      const result = await todoDb.createTodo(args.task, args.dueDate);
      
      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: `Todo created successfully with ID: ${result.id}\nTask: ${args.task}\nDue Date: ${args.dueDate || 'Not set'}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: "Failed to create todo. Please try again.",
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating todo: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Tool to delete a todo by ID
server.tool(
  "delete-todo",
  "Delete a todo item by its ID",
  {
    id: z.number().int().positive().describe("The ID of the todo to delete"),
  },
  async (args) => {
    try {
      const result = await todoDb.deleteTodoById(args.id);
      
      if (result.success) {
        if (result.deleted) {
          return {
            content: [
              {
                type: "text",
                text: `Todo with ID ${args.id} has been successfully deleted.`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `No todo found with ID ${args.id}. Nothing was deleted.`,
              },
            ],
          };
        }
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete todo with ID ${args.id}. Please try again.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting todo: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Tool to search todos
server.tool(
  "search-todos",
  "Search for todos containing specific text",
  {
    query: z.string().describe("The search query to find in todo tasks"),
  },
  async (args) => {
    try {
      const todos = await todoDb.searchTodo(args.query);
      
      if (todos.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No todos found matching "${args.query}".`,
            },
          ],
        };
      }

      const formattedTodos = todos.map(todo => 
        `ID: ${todo.id}\nTask: ${todo.task}\nDue Date: ${todo.due_date || 'Not set'}\nCreated: ${todo.created_at}\n---`
      ).join('\n');

      return {
        content: [
          {
            type: "text",
            text: `Found ${todos.length} todo(s) matching "${args.query}":\n\n${formattedTodos}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching todos: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down todo server...');
  todoDb.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down todo server...');
  todoDb.close();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  todoDb.close();
  process.exit(1);
});