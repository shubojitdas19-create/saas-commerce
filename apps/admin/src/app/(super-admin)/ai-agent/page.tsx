"use client";

import { useState } from "react";
import { Loader2, Play, CheckCircle2, AlertTriangle, Bot } from "lucide-react";

export default function AiAgentDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [totalProcessed, setTotalProcessed] = useState(0);

  const triggerAgent = async () => {
    setIsProcessing(true);
    setLogs(prev => ["🤖 Triggering AI Batch (Fetching 5 books)...", ...prev]);

    try {
      // Calls your new API route
      const res = await fetch("/api/admin/run-ai?secret=boihut-auto-sync");
      const data = await res.json();

      if (data.logs) {
        setLogs(prev => [...data.logs, ...prev]);
      }
      
      if (data.processedCount) {
        setTotalProcessed(prev => prev + data.processedCount);
      }

      if (data.message) {
        setLogs(prev => [data.message, ...prev]);
      }

    } catch (error) {
      setLogs(prev => ["❌ Connection error. AI failed to run.", ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
               <Bot className="size-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Catalog Manager</h1>
              <p className="text-gray-500 mt-1">Autonomously researches and fixes incorrect authors and categories.</p>
            </div>
          </div>
          <button 
            onClick={triggerAgent}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {isProcessing ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
            {isProcessing ? "AI is Researching..." : "Process Next 5 Books"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 flex flex-col items-center justify-center text-center h-48">
             <CheckCircle2 className="size-12 text-green-500 mb-3" />
             <p className="text-4xl font-extrabold text-gray-900">{totalProcessed}</p>
             <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Books Fixed This Session</p>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-inner col-span-1 lg:col-span-2 h-[500px] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-4">
               <h2 className="text-white font-mono text-sm uppercase tracking-wider font-bold flex items-center gap-2">
                 <AlertTriangle className="size-4 text-yellow-500" /> Live Execution Logs
               </h2>
               {isProcessing && <span className="flex items-center gap-2 text-green-400 font-mono text-xs animate-pulse"><span className="size-2 bg-green-400 rounded-full" /> Searching Google...</span>}
            </div>
            
            <div className="flex-1 overflow-y-auto font-mono text-[13px] text-green-400 space-y-3 pr-2">
               {logs.length === 0 ? (
                 <p className="text-gray-500 italic">System ready. Awaiting your command to start...</p>
               ) : (
                 logs.map((log, idx) => (
                   <p key={idx} className="border-b border-gray-800 pb-2 break-words leading-relaxed">{log}</p>
                 ))
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}