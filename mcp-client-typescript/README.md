# An LLM-Powered Chatbot MCP Client written in TypeScript

This MCP client uses Google's Gemini AI models to provide conversational AI capabilities with tool calling support.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your Gemini API key:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```
   
   You can get an API key from [Google AI Studio](https://aistudio.google.com/).

3. Build the project:
   ```bash
   npm run build
   ```

4. Run the client:
   ```bash
   npm start
   ```

## Features

- **Gemini Integration**: Uses Google's Gemini 1.5 Pro model for natural language processing
- **MCP Tool Support**: Seamlessly integrates with MCP servers for extended functionality
- **Function Calling**: Supports tool calling to interact with external systems
- **Interactive Chat**: Command-line interface for conversational interactions

See the [Building MCP clients](https://modelcontextprotocol.io/tutorials/building-a-client) tutorial for more information.
