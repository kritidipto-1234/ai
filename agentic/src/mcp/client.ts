import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { GoogleGenerativeAI, GenerativeModel, FunctionDeclaration, SchemaType, ChatSession } from '@google/generative-ai';


class MCPClient {
    private clients!: Client[];
    private transports!: StdioClientTransport[];
    private readonly genAI: GoogleGenerativeAI;
    private model!: GenerativeModel;
    private chat!: ChatSession;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        this.clients = [] as Client[];
        this.transports = [] as StdioClientTransport[];
        
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async connectToServers(serverScriptPaths: string[]): Promise<void> {
        for (const serverPath of serverScriptPaths) {
            const transport = new StdioClientTransport({
                command: 'node',
                args: [serverPath.replace('.js', '')]
            });
    
            const client = new Client({
                name: 'mcp-client-typescript',
                version: '1.0.0'
            }, {
                capabilities: {}
            });
    
            await client.connect(transport);
    
            // List available tools
            const response = await client.listTools();
            const tools = response.tools || [];
            console.log('\nConnected to server with tools:', tools.map(tool => tool.name));

            this.clients.push(client);
            this.transports.push(transport);
        }
    }

    async convertMcpToolsToGeminiFunctionDeclarations(client: Client) {
        // Get available tools from MCP server
        const response = await client.listTools();
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

        return availableTools;

    }

    async startChat(SYSTEM_PROMPT: string){
        if (this.clients.length === 0) {
            throw new Error('Client not connected to server');
        }

        const availableTools: FunctionDeclaration[] = [];

        for (const client of this.clients) {
            const tools = await this.convertMcpToolsToGeminiFunctionDeclarations(client);
            availableTools.push(...tools);
        }

        // Create a model with function calling capability
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: availableTools.length > 0 ? [{ functionDeclarations: availableTools }] : undefined,
            systemInstruction: SYSTEM_PROMPT
        });

        // Start chat session
        this.chat = this.model.startChat();
    }

    async findClientWithTool(functionName: string) {
        for (const client of this.clients) {
            const tools = await this.convertMcpToolsToGeminiFunctionDeclarations(client);
            if (tools.some(tool => tool.name === functionName)) {
                return client;
            }
        }
        return null;
    }

    async processQuery(query: string): Promise<string> {

        // Send initial query
        let result = await this.chat.sendMessage(query);
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
                            const targetClient = await this.findClientWithTool(functionName);
                            if (!targetClient) {
                                throw new Error(`Tool ${functionName} not found on any connected server`);
                            }
                            const toolResult = await targetClient.callTool({
                                name: functionName,
                                arguments: functionArgs
                            });

                            finalText.push(`[Calling tool ${functionName} with args ${JSON.stringify(functionArgs)}]`);

                            // Send function result back to Gemini
                            result = await this.chat.sendMessage([{
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
                            result = await this.chat.sendMessage([{
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

    async cleanup(): Promise<void> {
        for (const client of this.clients) {
            await client.close();
        }
        for (const transport of this.transports) {
            await transport.close();
        }
    }
}

export default MCPClient;
