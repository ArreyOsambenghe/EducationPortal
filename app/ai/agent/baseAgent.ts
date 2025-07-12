// lib/agents/base-agent.ts
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { PromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

interface AgentStreamMessage {
  type: 'status' | 'thinking' | 'result' | 'error';
  timestamp: string;
  message?: string;
  data?: any;
  agent?: string;
  steps?: number;
}

export abstract class BaseAgent {
  protected model: ChatTogetherAI;
  protected agent!: AgentExecutor;
  protected agentName: string;
  protected agentDescription: string;

  constructor(agentName: string, agentDescription: string) {
    this.agentName = agentName;
    this.agentDescription = agentDescription;

    if (!process.env.TOGETHER_API_KEY) {
      throw new Error("TOGETHER_API_KEY environment variable is not set.");
    }

    // Initialize the AI model with streaming
    this.model = new ChatTogetherAI({
      apiKey: process.env.TOGETHER_API_KEY!,
      modelName: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      streaming: true,
      temperature: 0.1,
    });

    this.initializeAgent();
  }

  protected abstract createTools(): DynamicStructuredTool[];

  private async initializeAgent(): Promise<void> {
    const tools = this.createTools();
    this.agent = await this.createAgentExecutor(tools);
  }

  private async createAgentExecutor(tools: any[]): Promise<AgentExecutor> {
    const prompt = this.createPromptTemplate();
    const agent = await createReactAgent({ llm: this.model, tools, prompt });

    return new AgentExecutor({
      agent,
      tools,
      verbose: process.env.NODE_ENV === "development",
      maxIterations: 10,
      handleParsingErrors: true,
      returnIntermediateSteps: true,
    });
  }

  protected createPromptTemplate(): PromptTemplate {
    return PromptTemplate.fromTemplate(`
You are {agent_name} for a university portal system. {agent_description}

You have access to the following tools:
{tools}

Use this format:
Question: the input question you must answer
Thought: you should always think about what to do
**Before executing any tool, first echo to the user using the respond tool:**
Tool to use: <tool_name>
Tool input: <valid JSON>
Action: the action to take, must be one of [{tool_names}]
**Before executing any tool, first echo to the user using the respond tool:**
Tool to use: <tool_name>
Tool input: <valid JSON>
If the user question does not require an action, you can provide a Final Answer directly without any Action.
**IMPORTANT**: The JSON you emit on “Action Input:” must be strictly one line, with no literal line-breaks. If you need paragraphs in a description field, collapse them into spaces.
Action Input: valid JSON for the action
Observation: the result of the action
...(repeat Thought/Action/Action Input/Observation)...
Thought: I now know the final answer
Final Answer: the final answer

Begin!

Rules for creation:
- Programs are top-level (no dependencies)
- Levels require an existing programId
- Semesters require an existing levelId
- Extract meaningful names and descriptions from user input
- to create , if no description and code are been provide for the creation generate it meaningful

Question: {input}
{agent_scratchpad}
    `);
  }

  async processQuery(query: string): Promise<ReadableStream<Uint8Array>> {
    // Use the native TransformStream in Edge runtime
    const { readable, writable } = new TransformStream<string, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(new TextEncoder().encode(chunk));
      },
    });
    const writer = writable.getWriter();

    this.executeQueryWithStreaming(query, writer);
    return readable;
  }

  private async executeQueryWithStreaming(
    query: string,
    writer: WritableStreamDefaultWriter<string>
  ): Promise<void> {
    try {
      // Initial status
      await this.writeToStream(writer, {
        type: "status",
        message: `${this.agentName} is processing your request...`,
        timestamp: new Date().toISOString(),
      });

      // Invoke the agent
      const result = await this.agent.invoke({ 
        input: query,
        agent_name: this.agentName,
        agent_description: this.agentDescription
      });

      // Intermediate reasoning steps
      if (result.intermediateSteps?.length) {
        await this.writeToStream(writer, {
          type: "thinking",
          message: "Agent is reasoning through the problem...",
          steps: result.intermediateSteps.length,
          timestamp: new Date().toISOString(),
        });
      }

      // Final result
      await this.writeToStream(writer, {
        type: "result",
        data: result.output,
        agent: this.agentName,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      await this.writeToStream(writer, {
        type: "error",
        message: error instanceof Error ? error.message : "An unexpected error occurred.",
        agent: this.agentName,
        timestamp: new Date().toISOString(),
      });
    } finally {
      await writer.close();
    }
  }

  async query(input: string): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    agent: string;
  }> {
    try {
      const result = await this.agent.invoke({ 
        input,
        agent_name: this.agentName,
        agent_description: this.agentDescription
      });
      return { success: true, data: result.output, agent: this.agentName };
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred.",
        agent: this.agentName,
      };
    }
  }

  private async writeToStream(
    writer: WritableStreamDefaultWriter<string>,
    msg: AgentStreamMessage
  ) {
    writer.write(JSON.stringify(msg) + "\n");
  }
}