import { describe, it, expect } from 'vitest';
import { validateAttachmentFile, isAuthorizedOwner } from '@/lib/security/sanitize';

describe('Security & File Validation Tests', () => {
  it('accepts valid PDF documents', () => {
    const fakePdf = new File(['%PDF-1.4 test content'], 'spec.pdf', {
      type: 'application/pdf',
    });
    const result = validateAttachmentFile(fakePdf);
    expect(result.valid).toBe(true);
    expect(result.type).toBe('pdf');
  });

  it('accepts valid image uploads (PNG, JPEG, WebP)', () => {
    const fakePng = new File(['fake-png-bytes'], 'screenshot.png', {
      type: 'image/png',
    });
    const resultPng = validateAttachmentFile(fakePng);
    expect(resultPng.valid).toBe(true);
    expect(resultPng.type).toBe('image');

    const fakeJpg = new File(['fake-jpg-bytes'], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const resultJpg = validateAttachmentFile(fakeJpg);
    expect(resultJpg.valid).toBe(true);
    expect(resultJpg.type).toBe('image');
  });

  it('accepts text and markdown files', () => {
    const fakeMd = new File(['# Title'], 'notes.md', {
      type: 'text/markdown',
    });
    const resultMd = validateAttachmentFile(fakeMd);
    expect(resultMd.valid).toBe(true);
    expect(resultMd.type).toBe('markdown');

    const fakeTxt = new File(['sample log'], 'log.txt', {
      type: 'text/plain',
    });
    const resultTxt = validateAttachmentFile(fakeTxt);
    expect(resultTxt.valid).toBe(true);
    expect(resultTxt.type).toBe('text');
  });

  it('blocks potentially unsafe or unsupported file types', () => {
    const maliciousExe = new File(['fake binary'], 'payload.exe', {
      type: 'application/x-msdownload',
    });
    expect(validateAttachmentFile(maliciousExe).valid).toBe(false);

    const scriptFile = new File(['alert(1)'], 'script.js', {
      type: 'application/javascript',
    });
    expect(validateAttachmentFile(scriptFile).valid).toBe(false);

    const zipFile = new File(['archive content'], 'data.zip', {
      type: 'application/zip',
    });
    expect(validateAttachmentFile(zipFile).valid).toBe(false);
  });

  it('blocks oversized files (> 20 MB)', () => {
    // 21 MB fake file
    const oversized = {
      name: 'large.pdf',
      size: 21 * 1024 * 1024,
      type: 'application/pdf',
    } as unknown as File;

    const result = validateAttachmentFile(oversized);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('verifies owner authentication check correctly', () => {
    const originalEnv = process.env.OWNER_EMAIL;
    try {
      process.env.OWNER_EMAIL = 'owner@example.com';
      expect(isAuthorizedOwner('owner@example.com')).toBe(true);
      expect(isAuthorizedOwner('OWNER@EXAMPLE.COM')).toBe(true);
      expect(isAuthorizedOwner('attacker@bad.com')).toBe(false);
      expect(isAuthorizedOwner(null)).toBe(false);
      expect(isAuthorizedOwner(undefined)).toBe(false);
    } finally {
      process.env.OWNER_EMAIL = originalEnv;
    }
  });
});
