import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { GoogleGenerativeAI, GenerativeModel, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import * as readline from 'readline';

class MCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private genAI: GoogleGenerativeAI;
    // private model: GenerativeModel;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async connectToServer(serverScriptPath: string): Promise<void> {
        const isPython = serverScriptPath.endsWith('.py');
        const isJs = serverScriptPath.endsWith('.js');
        
        if (!isPython && !isJs) {
            throw new Error('Server script must be a .py or .js file');
        }

        const command = isPython ? 'python' : 'node';

        this.transport = new StdioClientTransport({
            command,
            args: [serverScriptPath]
        });

        this.client = new Client({
            name: 'mcp-client-typescript',
            version: '1.0.0'
        }, {
            capabilities: {}
        });

        await this.client.connect(this.transport);

        // List available tools
        const response = await this.client.listTools();
        const tools = response.tools || [];
        console.log('\nConnected to server with tools:', tools.map(tool => tool.name));
    }

    async processQuery(query: string): Promise<string> {
        if (!this.client) {
            throw new Error('Client not connected to server');
        }

        // Get available tools from MCP server
        const response = await this.client.listTools();
        const availableTools: FunctionDeclaration[] = [];

        // Convert MCP tools to Gemini function declarations
        for (const tool of response.tools || []) {
            const properties: Record<string, any> = {};
            const required: string[] = [];

            if (tool.inputSchema && typeof tool.inputSchema === 'object' && 'properties' in tool.inputSchema) {
                const schemaProperties = tool.inputSchema.properties as Record<string, any>;
                
                for (const [propName, propDef] of Object.entries(schemaProperties)) {
                    properties[propName] = {
                        type: this.convertJsonSchemaType(propDef.type || 'string'),
                        description: propDef.description || ''
                    };
                }

                if (tool.inputSchema.required && Array.isArray(tool.inputSchema.required)) {
                    required.push(...tool.inputSchema.required);
                }
            }

            const functionDeclaration: FunctionDeclaration = {
                name: tool.name,
                description: tool.description || '',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties,
                    required
                }
            };

            availableTools.push(functionDeclaration);
        }

        // Create a model with function calling capability
        const modelWithTools = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: availableTools.length > 0 ? [{ functionDeclarations: availableTools }] : undefined
        });

        // Start chat session
        const chat = modelWithTools.startChat();

        // Send initial query
        let result = await chat.sendMessage(query);
        const finalText: string[] = [];

        while (true) {
            let hasFunctionCall = false;

            // Check if there are function calls to execute
            if (result.response.candidates?.[0]?.content?.parts) {
                for (const part of result.response.candidates[0].content.parts) {
                    if (part.functionCall) {
                        hasFunctionCall = true;
                        const functionCall = part.functionCall;
                        const functionName = functionCall.name;
                        const functionArgs: { [x: string]: unknown } = functionCall.args as { [x: string]: unknown } || {};

                        // Execute the MCP tool
                        try {
                            const toolResult = await this.client.callTool({
                                name: functionName,
                                arguments: functionArgs
                            });

                            finalText.push(`[Calling tool ${functionName} with args ${JSON.stringify(functionArgs)}]`);

                            // Send function result back to Gemini
                            result = await chat.sendMessage([{
                                functionResponse: {
                                    name: functionName,
                                    response: {
                                        result: Array.isArray(toolResult.content) 
                                            ? toolResult.content.map(c => c.text || c.toString()).join('\n')
                                            : toolResult.content?.toString() || 'No result'
                                    }
                                }
                            }]);
                        } catch (error) {
                            // Handle tool execution error
                            result = await chat.sendMessage([{
                                functionResponse: {
                                    name: functionName,
                                    response: {
                                        error: error instanceof Error ? error.message : String(error)
                                    }
                                }
                            }]);
                        }
                    } else if (part.text) {
                        finalText.push(part.text);
                    }
                }
            }

            // If no function calls were made, we're done
            if (!hasFunctionCall) {
                break;
            }
        }

        return finalText.length > 0 ? finalText.join('\n') : 'No response generated';
    }

    private convertJsonSchemaType(jsonType: string): SchemaType {
        const typeMapping: Record<string, SchemaType> = {
            'string': SchemaType.STRING,
            'number': SchemaType.NUMBER,
            'integer': SchemaType.INTEGER,
            'boolean': SchemaType.BOOLEAN,
            'array': SchemaType.ARRAY,
            'object': SchemaType.OBJECT
        };
        return typeMapping[jsonType.toLowerCase()] || SchemaType.STRING;
    }

    async chatLoop(): Promise<void> {
        console.log('\nMCP Client with Gemini Started!');
        console.log("Type your queries or 'quit' to exit.");

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = (question: string): Promise<string> => {
            return new Promise((resolve) => {
                rl.question(question, (answer) => {
                    resolve(answer);
                });
            });
        };

        while (true) {
            try {
                const query = (await askQuestion('\nQuery: ')).trim();

                if (query.toLowerCase() === 'quit') {
                    break;
                }

                const response = await this.processQuery(query);
                console.log('\n' + response);
            } catch (error) {
                console.log(`\nError: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        rl.close();
    }

    async cleanup(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
        if (this.transport) {
            await this.transport.close();
        }
    }
}

async function main(): Promise<void> {
    if (process.argv.length < 3) {
        console.log('Usage: node index.js <path_to_server_script>');
        process.exit(1);
    }

    const client = new MCPClient();
    try {
        await client.connectToServer(process.argv[2]);
        await client.chatLoop();
    } finally {
        await client.cleanup();
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
