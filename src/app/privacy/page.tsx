import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#101114] text-[#F5F5F5] p-6 sm:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#FF8A45] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My AI</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF8A45]/15 border border-[#FF8A45]/30 flex items-center justify-center text-[#FF8A45]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">Last updated: November 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-[#D1D5DB] leading-relaxed border-t border-[#30333B] pt-6">
          <section>
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">1. Private Personal Architecture</h2>
            <p>
              My AI is engineered exclusively as a private, single-owner AI workspace. Unlike multi-tenant commercial platforms, your conversations, prompts, attached documents, and personal settings are never sold, mined, or used to train third-party AI models.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">2. Data Storage & Ownership</h2>
            <p>
              All conversation history, uploaded files, and usage logs are stored directly within your local browser storage (IndexedDB) and your private Supabase database protected by PostgreSQL Row-Level Security (RLS). You retain 100% data sovereignty.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">3. Anthropic Claude API Transmission</h2>
            <p>
              When you prompt My AI, text and attachment payloads are transmitted securely via TLS 1.3 to the official Anthropic API to generate intelligent streaming completions. Anthropic operates under commercial zero-data-retention and non-training commitments for enterprise API endpoints.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">4. Data Deletion</h2>
            <p>
              You can instantly purge all conversation records, message history, and token usage from your settings at any time with a single click.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

