# AI Todo Assistant

A minimal AI agent that helps manage todo tasks with due dates using Gemini AI.

## Setup

1. Make sure you have `GEMINI_API_KEY` in your environment
2. Install dependencies: `npm install`
3. Run the agent: `npm run dev`

## Usage

The agent follows a strict message flow:
- **User**: Your input/request
- **Plan**: AI explains what it will do
- **Action**: AI calls a function with parameters
- **Observation**: Result from the function call
- **Output**: Final response to user

## Available Commands

- Add todos: "Add a task to buy groceries"
- View todos: "Show me all my todos"
- Search todos: "Find todos about shopping"
- Delete todos: "Delete todo with id 5"
- Add with due date: "Add a task to finish project by 2024-12-25"

Type "quit" to exit.
