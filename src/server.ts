#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type ReadResourceRequest,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { KEGGClient } from './client.js';
import { buildToolDefinitions, buildToolHandlers } from './tools.js';
import { buildResourceTemplates, handleResourceRequest } from './resources.js';

export class KEGGServer {
  private server: Server;
  private client: KEGGClient;

  constructor() {
    this.server = new Server(
      {
        name: 'kegg-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.client = new KEGGClient();

    this.setupResourceHandlers();
    this.setupToolHandlers();

    this.server.onerror = (error: Error) => {
      console.error('[MCP Error]', error);
    };
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async () => ({
        resourceTemplates: buildResourceTemplates(),
      })
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: ReadResourceRequest) => {
        const uri = request.params.uri;
        return handleResourceRequest(this.client, uri);
      }
    );
  }

  private setupToolHandlers() {
    const tools = buildToolDefinitions();
    const handler = buildToolHandlers(this.client);

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;
      try {
        const result = await handler(name, args ?? {});
        return result as { content: Array<{ type: 'text'; text: string }>; isError?: boolean };
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('KEGG MCP server running on stdio');
  }
}

const server = new KEGGServer();
server.run().catch(console.error);
