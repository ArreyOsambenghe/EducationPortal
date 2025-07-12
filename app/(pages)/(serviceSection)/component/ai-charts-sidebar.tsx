'use client';

import { useState, useRef, useEffect } from 'react';
import { LoaderCircle, Send, XIcon } from 'lucide-react';

// Message interfaces
type MessageType = 'user' | 'ai' | 'system' | 'error';
interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}

type AgentMessage = {
  type: string;
  [key: string]: any;
};

// Parser for streaming JSON lines
function parseAgentMessages(lines: string[]): { status?: string; result?: string } {
  const output: { status?: string; result?: string } = {};

  lines.forEach((line) => {
    line = line.trim();
    if (!line) return;
    try {
      const parsed: AgentMessage = JSON.parse(line);
      if (parsed.type === 'status') {
        output.status = parsed.message;
      } else if (parsed.type === 'result') {
        output.result = parsed.data;
      }
    } catch (err) {
      console.error('Invalid JSON line:', line);
    }
  });

  return output;
}

export default function AcademicAIChat() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'system-1',
    type: 'system',
    content: "Hello! I'm your Academic AI Assistant. Ask me to create or manage programs, levels, and semesters.",
    timestamp: new Date(),
  }]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to add messages
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setInput('');
    setIsProcessing(true);

    addMessage({ type: 'user', content: userInput });

    try {
      const response = await fetch(`/api/agent/academic-structure?q=${encodeURIComponent(userInput)}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const lines: string[] = [];

      // Stream reading
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          lines.push(line);

          // Parse partial
          const { status } = parseAgentMessages([line]);
          if (status) addMessage({ type: 'system', content: status });
        }
      }
      // Handle remaining buffer
      if (buffer.trim()) lines.push(buffer.trim());

      // Final parse for result
      const { result } = parseAgentMessages(lines);
      if (result) {
        addMessage({ type: 'ai', content: result });
      }
    } catch (error: any) {
      console.error('Streaming error:', error);
      addMessage({ type: 'error', content: '❌ An error occurred while processing your request.' });
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  // Styling by message type
  const getMessageStyle = (type: MessageType) => {
    switch (type) {
      case 'user': return 'bg-blue-500 text-white ml-auto max-w-[80%] min-h-fit h-full';
      case 'ai': return 'bg-white text-gray-800 mr-auto max-w-[80%] min-h-fit h-full border border-gray-200';
      case 'system': return 'bg-green-50 text-green-800 mx-auto max-w-[90%] min-h-fit h-full border border-green-200';
      case 'error': return 'bg-red-50 text-red-800 mx-auto max-w-[90%] min-h-fit h-full border border-red-200';
      default: return 'bg-gray-100 text-gray-800 mx-auto max-w-[90%] min-h-fit h-full border border-gray-200';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <div>
          <h2 className="text-lg font-semibold">Academic AI Assistant</h2>
          <p className="text-sm text-gray-600">Manage programs, levels, & semesters</p>
        </div>
        <button onClick={() => {/* close logic */}} className="p-2"><XIcon size={16} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="flex">
            <div className={`px-4 py-2 rounded-lg ${getMessageStyle(msg.type)}`}>
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              <div className="text-xs opacity-60 mt-1">{msg.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
              <LoaderCircle size={16} className="animate-spin" />
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 bg-gray-50 border-t">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          rows={3}
          disabled={isProcessing}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isProcessing ? <LoaderCircle size={16} className="animate-spin inline-block mr-2" /> : <Send size={16} className="inline-block mr-2" />}Send
        </button>
      </form>
    </div>
  );
}
