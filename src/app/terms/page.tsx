import Link from 'next/link';
import { ArrowLeft, FileCheck } from 'lucide-react';

export default function TermsPage() {
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
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Terms & Conditions</h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">Last updated: November 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-[#D1D5DB] leading-relaxed border-t border-[#30333B] pt-6">
          <section>
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">1. Personal Use License</h2>
            <p>
              My AI is an open-source, private assistant tool designed for single-owner personal and engineering productivity. The owner holds full responsibility for the prompts executed and generated outputs.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">2. Artificial Intelligence Disclaimers</h2>
            <p>
              AI completions are powered by Anthropic Claude LLMs. While Claude provides exceptional reasoning and coding assistance, AI models can occasionally produce inaccurate or incomplete information. Users should exercise standard engineering discretion when deploying AI-generated code.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">3. Acceptable Use Policy</h2>
            <p>
              Usage of the underlying Anthropic Claude API must adhere to Anthropic's Usage Policy, including restrictions against malicious software generation or illegal activities.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

