"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

type FixResult = {
  id: string;
  title: string;
  originalDescription: string;
  extractedAuthor: string;
};

export default function FixAuthorsCommaPage() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"idle" | "scanned" | "fixed">("idle");
  const [results, setResults] = useState<FixResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runScript = async (action: "scan" | "fix") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fix-authors-comma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: action })
      });
      const data = await res.json();
      
      if (data.success) {
        setResults(data.results);
        setMode(action === "scan" ? "scanned" : "fixed");
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-b pb-5">
          <h1 className="text-3xl font-bold text-gray-900">Pattern 2: Comma Extractor</h1>
          <p className="mt-2 text-gray-600">
            Searches the <code className="bg-gray-200 px-1 rounded">description</code> field for a comma (,) and extracts the text before it as the Author.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => runScript("scan")}
            disabled={loading || mode === "fixed"}
            className="rounded-md bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {loading && mode === "idle" ? <Loader2 className="inline mr-2 size-4 animate-spin" /> : null}
            1. Preview Changes (Dry Run)
          </button>
          
          <button 
            onClick={() => runScript("fix")}
            disabled={loading || mode !== "scanned"}
            className="flex items-center rounded-md bg-red-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
          >
            {loading && mode === "scanned" ? <Loader2 className="inline mr-2 size-4 animate-spin" /> : <AlertTriangle className="mr-2 size-4" />}
            2. Apply Fix to Database
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700 border border-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {mode === "fixed" && (
          <div className="mb-6 rounded-md bg-green-50 p-4 text-green-700 border border-green-200 flex items-center gap-2">
            <CheckCircle className="size-5" />
            Successfully updated <strong>{results.length}</strong> books in the database!
          </div>
        )}

        {results.length > 0 && (
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between">
              <span className="font-semibold text-gray-700">Found {results.length} books to fix</span>
              {mode === "scanned" && <span className="text-blue-600 text-sm font-medium">Preview Mode</span>}
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-900 border-b">Book Title</th>
                    <th className="px-4 py-3 font-semibold text-red-700 border-b">Original Description</th>
                    <th className="px-4 py-3 font-semibold text-blue-700 border-b">Extracted Author</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-red-600 bg-red-50/30 line-clamp-2">{r.originalDescription}</td>
                      <td className="px-4 py-3 font-bold text-blue-700 bg-blue-50/30">{r.extractedAuthor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}