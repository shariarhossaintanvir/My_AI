'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#101114] text-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-400 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">Application Encountered an Error</h1>
      <p className="text-xs text-[#A1A1AA] mt-1.5 max-w-md">
        {error.message || 'An unexpected runtime error occurred. Please try reloading the session.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF8A45] hover:bg-[#E57734] text-white text-xs font-semibold transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
