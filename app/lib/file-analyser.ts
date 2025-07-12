import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { FileAnalysisRequest, FileAnalysisResponse, GeminiToolDeclaration } from './file-analyser.type';

export class GeminiFileAnalyzer {
  private genai: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private model: any;

  constructor(apiKey: string) {
    this.genai = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.model = this.genai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Get the tool declaration for Gemini SDK
   */
  getToolDeclaration(): GeminiToolDeclaration {
    return {
      function_declarations: [
        {
          name: 'analyze_file',
          description: 'Analyze uploaded files (PDF, images, documents) to generate study notes, summaries, or answer questions about the content',
          parameters: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: 'Path to the file to analyze'
              },
              analysis_type: {
                type: 'string',
                enum: ['notes', 'summary', 'question_answer', 'key_concepts'],
                description: 'Type of analysis to perform'
              },
              question: {
                type: 'string',
                description: 'Specific question to answer about the file content (required for question_answer type)'
              },
              focus_area: {
                type: 'string',
                description: 'Specific area or topic to focus on during analysis'
              }
            },
            required: ['file_path', 'analysis_type']
          }
        }
      ]
    };
  }

  /**
   * Analyze a file and return educational content
   */
  async analyzeFile(params: FileAnalysisRequest): Promise<FileAnalysisResponse> {
    try {
      const { file_path, analysis_type, question, focus_area } = params;

      // Check if file exists
      if (!fs.existsSync(file_path)) {
        return {
          success: false,
          error: `File not found: ${file_path}`
        };
      }

      // Get file info
      const fileName = path.basename(file_path);
      const mimeType = mime.lookup(file_path);
      
      if (!mimeType) {
        return {
          success: false,
          error: 'Unable to determine file type'
        };
      }

      // Upload file to Gemini
      const uploadResponse = await this.fileManager.uploadFile(file_path, {
        mimeType: mimeType as string,
        displayName: fileName
      });

      // Generate prompt based on analysis type
      const prompt = this.generatePrompt(analysis_type, question, focus_area);

      // Analyze the file
      const result = await this.model.generateContent([
        prompt,
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri
          }
        }
      ]);

      const response = await result.response;
      const analysisContent = response.text();

      // Clean up uploaded file
      await this.fileManager.deleteFile(uploadResponse.file.name);

      return {
        success: true,
        data: {
          analysis_type,
          content: analysisContent,
          file_name: fileName,
          file_type: mimeType,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate appropriate prompt based on analysis type
   */
  private generatePrompt(
    analysisType: string, 
    question?: string, 
    focusArea?: string
  ): string {
    const baseContext = focusArea ? `Focus specifically on: ${focusArea}\n\n` : '';
    
    switch (analysisType) {
      case 'notes':
        return `${baseContext}Create comprehensive study notes from this file. Include:
        - Key concepts and definitions
        - Important points and main ideas
        - Structured outline format
        - Bullet points for easy reading
        - Any formulas, dates, or critical information
        Make the notes suitable for student review and study.`;

      case 'summary':
        return `${baseContext}Provide a concise summary of this file. Include:
        - Main themes and key points
        - Important conclusions
        - Essential information a student should know
        - Brief overview of the content structure
        Keep it clear and accessible for educational purposes.`;

      case 'question_answer':
        if (!question) {
          return `${baseContext}Analyze this file and answer any questions about its content. If no specific question is provided, identify and answer the most important questions a student might have about this material.`;
        }
        return `${baseContext}Based on the content of this file, please answer the following question: "${question}"
        Provide a detailed, educational response that helps the student understand the topic thoroughly.`;

      case 'key_concepts':
        return `${baseContext}Extract and explain the key concepts from this file. For each concept:
        - Provide a clear definition
        - Explain its importance
        - Give context within the subject matter
        - Include any related terms or ideas
        Present this in a way that helps students understand and remember the material.`;

      default:
        return `${baseContext}Please analyze this file and provide educational insights that would be helpful for a student studying this material.`;
    }
  }
}