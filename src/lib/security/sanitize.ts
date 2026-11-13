// ==========================================
// MY AI — Security & Sanitization Utilities
// ==========================================

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
] as const;

export const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  type?: 'image' | 'pdf' | 'text' | 'markdown';
  mimeType?: string;
}

/**
 * Validates an uploaded file by checking its extension, reported MIME type, and size.
 */
export function validateAttachmentFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum size is 20 MB.`,
    };
  }

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  // Check PDF
  if (name.endsWith('.pdf') || type === 'application/pdf') {
    return { valid: true, type: 'pdf', mimeType: 'application/pdf' };
  }

  // Check Images
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || type === 'image/jpeg') {
    return { valid: true, type: 'image', mimeType: 'image/jpeg' };
  }
  if (name.endsWith('.png') || type === 'image/png') {
    return { valid: true, type: 'image', mimeType: 'image/png' };
  }
  if (name.endsWith('.webp') || type === 'image/webp') {
    return { valid: true, type: 'image', mimeType: 'image/webp' };
  }

  // Check Text / Markdown
  if (name.endsWith('.md') || type === 'text/markdown') {
    return { valid: true, type: 'markdown', mimeType: 'text/markdown' };
  }
  if (name.endsWith('.txt') || type === 'text/plain') {
    return { valid: true, type: 'text', mimeType: 'text/plain' };
  }

  return {
    valid: false,
    error: `Unsupported file type "${file.name}". Supported formats: PDF, TXT, MD, PNG, JPG, WebP.`,
  };
}

/**
 * Checks whether an authenticated email matches the designated application owner email.
 * Never trusts unconfigured environments or falsy inputs.
 */
export function isAuthorizedOwner(email?: string | null): boolean {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail || !email) {
    return false;
  }
  return email.trim().toLowerCase() === ownerEmail;
}
