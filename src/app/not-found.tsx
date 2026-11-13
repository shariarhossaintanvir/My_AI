import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#101114] text-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#1D2027] border border-[#30333B] flex items-center justify-center text-[#FF8A45] mb-4">
        <span className="font-mono text-xl font-bold">404</span>
      </div>
      <h1 className="text-xl font-bold tracking-tight">Page Not Found</h1>
      <p className="text-xs text-[#A1A1AA] mt-1.5 max-w-sm">
        The requested path does not exist in your private My AI assistant.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF8A45] hover:bg-[#E57734] text-white text-xs font-semibold transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Return to Chat</span>
      </Link>
    </div>
  );
}

