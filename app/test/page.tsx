"use client";

import { useEffect, useState } from "react";

type LogEntry = {
  role: string;
  message?: string;
  data?: any;
  args?: any;
  result?: any;
  response?: any;
  name?: string;
  error?: any;
};

type ParsedResponse = {
  paragraphs: string[];
  list: string[];
};

// Parser function for your custom response format
function parseFinalResponse(response: string): ParsedResponse {
  const result: ParsedResponse = { paragraphs: [], list: [] };

  const mainMatch = response.match(/__RESPONSE__([\s\S]*?)__ENDRESPONSE__/);
  if (!mainMatch) return result;

  const mainContent = mainMatch[1];

  // Parse paragraphs
  const pRegex = /__P__(.*?)__ENDP__/gs;
  let pMatch;
  while ((pMatch = pRegex.exec(mainContent)) !== null) {
    result.paragraphs.push(parseInlineFormatting(pMatch[1].trim()));
  }

  // Parse list items
  const listMatch = mainContent.match(/__LIST__([\s\S]*?)__ENDLIST__/);
  if (listMatch) {
    const listContent = listMatch[1];
    const itemRegex = /__ITEM__(.*?)__ITEM__END__/gs;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(listContent)) !== null) {
      result.list.push(parseInlineFormatting(itemMatch[1].trim()));
    }
  }

  return result;
}

function parseInlineFormatting(text: string): string {
  // Bold
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, "<strong>$1</strong>");
  // Underline
  text = text.replace(/__ul__(.*?)__ul__/g, "<u>$1</u>");
  return text;
}

export default function AIConversation() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [functionCalls, setFunctionCalls] = useState<{ name: string; status: "pending" | "success"; }[]>([]);
  const [finalResponse, setFinalResponse] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch("/api/agent/test/stream", {
        method: "POST",
        body: JSON.stringify({ prompt: "Get semester list and then get me all levels" }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let firstIterationReceived = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n").filter(Boolean);
        for (const line of lines) {
          const log: LogEntry = JSON.parse(line);
          setLogs((prev) => [...prev, log]);

          if (log.role === "log" && log.message?.includes("Loop iteration: 0") && !firstIterationReceived) {
            firstIterationReceived = true;
          }

          if (log.role === "function-call" && log.message) {
            setFunctionCalls((prev) => [...prev, { name: log.message as string, status: "pending" }]);
          }

          if (log.role === "function-response" && log.message) {
            setFunctionCalls((prev) =>
              prev.map((fn) =>
                fn.name === log.message ? { ...fn, status: "success" } : fn
              )
            );
          }

          if (log.role === "model-response" && log.message) {
            setFunctionCalls([]);
            setFinalResponse(log.message);
          }
        }
      }
    };

    fetchLogs();
  }, []);

  const parsed = finalResponse ? parseFinalResponse(finalResponse) : null;

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">🎓 AI Academic Assistant</h1>

      {/* User prompt */}
      <div className="bg-gray-100 rounded-lg p-4 shadow">
        <p><strong>User:</strong> Get semester list and then get me all levels</p>
      </div>

      {/* AI analysing */}
      {logs.find((log) => log.role === "log" && log.message?.includes("Loop iteration: 0") && !finalResponse) && (
        <div className="bg-blue-50 rounded-lg p-4 flex items-center space-x-3 shadow">
          <span>🤖 <strong>AI:</strong> Analysing your request...</span>
          <span className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></span>
        </div>
      )}

      {/* Function calls */}
      {functionCalls.map((fn, i) => (
        <div key={i} className="bg-yellow-50 rounded-lg p-4 flex items-center space-x-3 shadow">
          {fn.status === "pending" ? (
            <>
              <span>⚙️ Calling <strong>{fn.name}</strong>...</span>
              <span className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full"></span>
            </>
          ) : (
            <span>✅ <strong>{fn.name}</strong> succeeded</span>
          )}
        </div>
      ))}

      {/* Final AI response */}
      {parsed && (
        <div className="bg-green-50 rounded-lg p-4 shadow space-y-3">
          <p>🤖 <strong>AI:</strong></p>
          {parsed.paragraphs.map((p, i) => (
            <p key={i} className="text-gray-800" dangerouslySetInnerHTML={{ __html: p }}></p>
          ))}
          {parsed.list.length > 0 && (
            <ul className="list-disc ml-6 space-y-1">
              {parsed.list.map((item, i) => (
                <li key={i} className="text-gray-800" dangerouslySetInnerHTML={{ __html: item }}></li>
              ))}
            </ul>
          )}
        </div>
      )}
      {
        finalResponse && (
          <div className="bg-green-50 rounded-lg p-4 shadow space-y-3">
            <p>🤖 <strong>AI:</strong> {finalResponse}</p>
          </div>
        )
      }
    </div>
  );
}
