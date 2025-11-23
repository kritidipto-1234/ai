import * as readlineSync from 'readline-sync';
import MCPClient from '../mcp/client.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_PROMPT = `
You are an AI Assistant that helps users manage their todo list and get weather information.

You have access to 2 MCP servers:
- todo: To manage the user's todo list
- weather: To get the weather information for the user's location

Important rules for TODO server:
1. If user doesn't mention due date, ask for it. Never assume dates. Due date is REQUIRED for every todo.
2. Always be helpful and provide clear responses about todo operations.
3. When showing todos, format them nicely for the user.
4. For your reference, today's date is ${new Date().toISOString().split('T')[0]}.
5. if user asks something complicated like say , how many tasks involve animals, first fetch all tasks and then try to logic it

Important rules for WEATHER server:
1. Always be helpful and provide clear responses about weather information.
2. When showing weather information, format them nicely for the user.

`;

const servers = [
    '/Users/k0g0isg/Desktop/me/ai/agentic/build/mcp/servers/weather/index.js',
    '/Users/k0g0isg/Desktop/me/ai/agentic/build/mcp/servers/todo/index.js',
];

async function main() {
    console.log('🚀 Starting Intelligent Agent...\n');
    
    const client = new MCPClient();
    
    try {
        // Connect to the task MCP server 
        console.log('📡 Connecting to todo server...');
        await client.connectToServers(servers);
        
        // Start chat with the system prompt
        console.log('🤖 Initializing AI assistant...');
        await client.startChat(SYSTEM_PROMPT);
        
        console.log('✅ Todo Database Agent is ready!\n');
        console.log('💡 You can ask me to:');
        console.log('   - Add new todos');
        console.log('   - Show all todos');
        console.log('   - Search for todos');
        console.log('   - Delete todos');
        console.log('   - Type "exit" to quit\n');
        
        // Chat loop
        while (true) {
            const userInput = readlineSync.question('You: ');
            
            if (userInput.toLowerCase().trim() === 'exit') {
                console.log('\n👋 Goodbye! Your todos are safely stored.');
                break;
            }
            
            if (userInput.trim() === '') {
                console.log('Please enter a message or "exit" to quit.\n');
                continue;
            }
            
            try {
                console.log('\n🤔 Processing your request...\n');
                const response = await client.processQuery(userInput);
                console.log('🤖 Assistant:', response);
                console.log('\n' + '─'.repeat(50) + '\n');
            } catch (error) {
                console.error('❌ Error processing your request:', error instanceof Error ? error.message : 'Unknown error');
                console.log('\n' + '─'.repeat(50) + '\n');
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to start the todo agent:', error instanceof Error ? error.message : 'Unknown error');
        console.log('\nPlease make sure:');
        console.log('1. GEMINI_API_KEY environment variable is set');
        console.log('2. The todo server is properly built');
        console.log('3. All dependencies are installed');
    } finally {
        await client.cleanup();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    process.exit(0);
});

main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
