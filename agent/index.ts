import { Content, GoogleGenAI } from '@google/genai';
import * as readlineSync from 'readline-sync';
import { TodoDatabase } from './database';

interface AIResponse {
  type: 'plan' | 'action' | 'output';
  plan?: string;
  function?: string;
  input?: TodoInput;
  output?: string;
}

const SYSTEM_PROMPT = `
You are an AI To-Do List Assistant with START, PLAN, ACTION, Observation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on the result.
Once you get the observations, Return the AI response based on START prompt and observation.

You can manage tasks by adding, viewing, updating, and deleting them.
You must strictly follow the JSON output format.

Todo DB Schema:
id: Int and Primary Key
task: String
due_date: String (format: YYYY-MM-DD)
created_at: String

Available Tools:
- getAllTodos(): Returns all the Todos from Database
- createTodo(todo: string, dueDate?: string): Creates a new Todo in the DB and takes todo as a string and returns the id
- deleteTodoById(id: string): Deleted the todo by ID given in the DB
- searchTodo(query: string): Searches for all todos matching the query string using iLike in DB

You must respond in one of these JSON formats:

For PLAN:
{ "type": "plan", "plan": "I will try to get more context on what user needs to shop." }

For ACTION:
{ "type": "action", "function": "createTodo", "input": {task: "gardening", dueDate: "2025-09-08"} }
{ "type": "action", "function": "deleteTodoById", "input": {id: 1} }
{ "type": "action", "function": "searchTodo", "input": {"query": "gardening"} }
{ "type": "action", "function": "getAllTodos", "input": {} }

For OUTPUT:
{ "type": "output", "output": "Your todo has been added successfully!" }

Inputs from user:
{ "type": "observation", "observation": "Your todo has been added successfully with id 1!" }
{ "type": "observation", "observation": "You have 2 todos in your list" }

Always respond with valid JSON only. No other text or formatting.
If user doesnt mention due date ask, never assume date. Due date is a MUST for every todo.

If i give a task that is complicated like say how many study related tasks do i have, then first fetch all todos

For your reference today's date is ${new Date().toISOString().split('T')[0]}.
`;

type createTodoInput = {task: string, dueDate?: string};
type deleteTodoByIdInput = {id: number};
type searchTodoInput = {query: string};
type TodoInput = createTodoInput | deleteTodoByIdInput | searchTodoInput;

class TodoAgent {
  private genAI: GoogleGenAI;
  private db: TodoDatabase;
  private messages: Content[] = [];

  constructor() {
    this.genAI = new GoogleGenAI({});
    this.db = new TodoDatabase();
  }

  private async callTodoFunction(functionName: string, input: TodoInput): Promise<string> {
    try {
      switch (functionName) {
        case 'getAllTodos': {
          const todos = await this.db.getAllTodos();
          return JSON.stringify(todos);
        }
        case 'createTodo': {
          const {task, dueDate} = input as createTodoInput;
          const result = await this.db.createTodo(task.trim(), dueDate?.trim());
          return JSON.stringify(result);
        }
        case 'deleteTodoById': {
          const result = await this.db.deleteTodoById((input as deleteTodoByIdInput).id);
          return JSON.stringify(result);
        }
        case 'searchTodo': {
          const todos = await this.db.searchTodo((input as searchTodoInput).query);
          return JSON.stringify(todos);
        }
        default:
          return JSON.stringify({ error: 'Unknown function' });
      }
    } catch (error) {
      return JSON.stringify({ error: 'Function execution failed' });
    }
  }

  private async sendToAI(userInput?: string): Promise<AIResponse> {
    if (userInput) {
      this.messages.push({
        role: 'user',
        parts: [{ text: userInput }]
      });
    }
    
    const result = await this.genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: this.messages,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });

    const responseText = result.text || '';
    
    // Add AI response to messages
    this.messages.push({
      role: 'model',
      parts: [{ text: responseText }]
    });

    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse AI response:', responseText);
      return { type: 'output', output: 'Sorry, I encountered an error processing your request.' };
    }
  }

  async start() {
    console.log('🤖 AI Todo Assistant Started!');
    console.log('Type your todo requests or "quit" to exit.\n');

    while (true) {
      const userInput = readlineSync.question('You: ');
      
      if (userInput.toLowerCase() === 'quit') {
        break;
      }

      let currentResponse = await this.sendToAI(userInput);

      // Keep looping until we get an output response
      while (currentResponse.type !== 'output') {
        if (currentResponse.type === 'plan') {
          console.log(`🧠 Plan: ${currentResponse.plan}`);
          currentResponse = await this.sendToAI();
        } else if (currentResponse.type === 'action') {
          console.log(`⚡ Action: ${currentResponse.function}(${JSON.stringify(currentResponse.input)})`);
          
          // Execute the function and get observation
          const observation = await this.callTodoFunction(
            currentResponse.function!,
            currentResponse.input as TodoInput
          );
          
          console.log(`👀 Observation: ${observation}`);
          
          // Send observation back to AI
          const observationMessage = {type: 'observation', observation: observation};
          currentResponse = await this.sendToAI(JSON.stringify(observationMessage));
        }
      }

      // Final output
      console.log(`🤖 ${currentResponse.output}\n`);
    }

    this.db.close();
    console.log('Goodbye!');
  }
}

// Start the agent
const agent = new TodoAgent();
agent.start().catch(console.error);
