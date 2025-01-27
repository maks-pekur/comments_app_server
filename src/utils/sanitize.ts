import sanitizeHtml from 'sanitize-html';

export function sanitizeComment(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: ['a', 'code', 'i', 'strong'],
    allowedAttributes: {
      a: ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    enforceHtmlBoundary: true,
  });
}
