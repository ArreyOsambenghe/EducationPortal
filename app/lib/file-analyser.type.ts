export interface FileAnalysisRequest {
  file_path: string;
  analysis_type: 'notes' | 'summary' | 'question_answer' | 'key_concepts';
  question?: string;
  focus_area?: string;
}

export interface FileAnalysisResponse {
  success: boolean;
  data?: {
    analysis_type: string;
    content: string;
    file_name: string;
    file_type: string;
    timestamp: string;
  };
  error?: string;
}

export interface GeminiToolDeclaration {
  function_declarations: Array<{
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  }>;
}