import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

export abstract class BaseAIAgent<T extends z.ZodType> {
  protected model: ChatTogetherAI;
  protected parser: StructuredOutputParser<z.infer<T>>;
  protected schema: T;

  constructor(schema: T) {
    this.model = new ChatTogetherAI({
      apiKey: process.env.TOGETHER_API_KEY!,
      modelName: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
      
    });
    
    this.schema = schema;
    this.parser = StructuredOutputParser.fromZodSchema(schema);
  }

  protected abstract getSystemPrompt(): string;
  protected abstract getContextString(context?: any): string;

  async processRequest(userInput: string, context?: any) {
    const formatInstructions = this.parser.getFormatInstructions();
    const systemPrompt = this.getSystemPrompt();
    const contextString = this.getContextString(context);

    const prompt = PromptTemplate.fromTemplate(`
${systemPrompt}

Context:
${contextString}

User Request: {input}

{format_instructions}
`);

    const chain = prompt.pipe(this.model).pipe(this.parser);
    
    try {
      const result = await chain.invoke({
        input: userInput,
        format_instructions: formatInstructions,
      });
      
      return { success: true, data: result };
    } catch (error) {
      console.error("AI Agent Error:", error);
      return { success: false, error: "Failed to process request" };
    }
  }
}