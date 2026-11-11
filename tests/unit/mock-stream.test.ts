import { describe, it, expect } from 'vitest';
import { createMockStream, generateMockContent } from '@/lib/anthropic/mock';

describe('Mock AI Mode & Stream Tests', () => {
  it('generates structured contextual code responses for coding questions', () => {
    const response = generateMockContent('write a typescript function for data streaming');
    expect(response).toContain('```typescript');
    expect(response).toContain('processDataStream');
  });

  it('generates document analysis preview when PDF is attached', () => {
    const response = generateMockContent('What is this?', [
      {
        id: '1',
        name: 'annual_report.pdf',
        type: 'pdf',
        mimeType: 'application/pdf',
        size: 20480,
      },
    ]);

    expect(response).toContain('Document Analysis: annual_report.pdf');
    expect(response).toContain('Claude 3.5 native document input');
  });

  it('streams mock response tokens progressively', async () => {
    const stream = createMockStream({
      userPrompt: 'Tell me about yourself',
    });

    let chunksCount = 0;
    let fullText = '';

    for await (const chunk of stream) {
      chunksCount++;
      fullText += chunk;
      if (chunksCount > 10) break; // Test stream progression
    }

    expect(chunksCount).toBeGreaterThan(5);
    expect(fullText).toContain('MOCK AI MODE');
  });

  it('supports abort signal cancellation', async () => {
    const controller = new AbortController();
    const stream = createMockStream({
      userPrompt: 'A long prompt',
      signal: controller.signal,
    });

    let count = 0;
    for await (const _ of stream) {
      count++;
      if (count === 3) {
        controller.abort();
      }
    }

    expect(count).toBeLessThanOrEqual(4);
  });
});
