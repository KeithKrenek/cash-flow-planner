import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeDescription,
  sanitizeAccountName,
  sanitizeNotes,
  sanitizeCategory,
  containsXSSPatterns,
  escapeHtml,
  removeControlChars,
  sanitizeInput,
} from '@/lib/sanitize';

describe('sanitizeText', () => {
  it('returns empty string for null/undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('strips HTML tags', () => {
    expect(sanitizeText('<b>bold</b>')).toBe('bold');
    expect(sanitizeText('<script>alert(1)</script>test')).toBe('test');
  });

  it('strips script tags with content', () => {
    expect(sanitizeText('<script>alert("xss")</script>Safe')).toBe('Safe');
  });

  it('strips attributes', () => {
    expect(sanitizeText('<div onclick="alert(1)">text</div>')).toBe('text');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  text  ')).toBe('text');
  });

  it('handles nested tags', () => {
    expect(sanitizeText('<div><b><i>text</i></b></div>')).toBe('text');
  });

  it('handles malformed HTML', () => {
    expect(sanitizeText('<div>unclosed')).toBe('unclosed');
    expect(sanitizeText('text</div>')).toBe('text');
  });
});

describe('sanitizeDescription', () => {
  it('strips HTML and enforces max length', () => {
    const longText = 'a'.repeat(250);
    expect(sanitizeDescription(longText).length).toBe(200);
  });

  it('strips XSS attempts', () => {
    expect(sanitizeDescription('<img src=x onerror=alert(1)>Test')).toBe(
      'Test'
    );
  });
});

describe('sanitizeAccountName', () => {
  it('strips HTML and enforces max length', () => {
    const longText = 'a'.repeat(150);
    expect(sanitizeAccountName(longText).length).toBe(100);
  });

  it('handles normal account names', () => {
    expect(sanitizeAccountName('Chase Checking')).toBe('Chase Checking');
  });
});

describe('sanitizeNotes', () => {
  it('strips HTML and enforces max length', () => {
    const longText = 'a'.repeat(600);
    expect(sanitizeNotes(longText).length).toBe(500);
  });
});

describe('sanitizeCategory', () => {
  it('strips HTML and enforces max length', () => {
    const longText = 'a'.repeat(100);
    expect(sanitizeCategory(longText).length).toBe(50);
  });
});

describe('containsXSSPatterns', () => {
  it('detects script tags', () => {
    expect(containsXSSPatterns('<script>alert(1)</script>')).toBe(true);
    expect(containsXSSPatterns('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
  });

  it('detects javascript: protocol', () => {
    expect(containsXSSPatterns('javascript:alert(1)')).toBe(true);
  });

  it('detects event handlers', () => {
    expect(containsXSSPatterns('onclick=alert(1)')).toBe(true);
    expect(containsXSSPatterns('onerror=alert(1)')).toBe(true);
    expect(containsXSSPatterns('onload=alert(1)')).toBe(true);
  });

  it('detects img onerror', () => {
    expect(containsXSSPatterns('<img src=x onerror=alert(1)>')).toBe(true);
  });

  it('detects svg onload', () => {
    expect(containsXSSPatterns('<svg onload=alert(1)>')).toBe(true);
  });

  it('detects data URIs', () => {
    expect(containsXSSPatterns('data:text/html,<script>alert(1)</script>')).toBe(
      true
    );
  });

  it('detects iframe', () => {
    expect(containsXSSPatterns('<iframe src="evil.com">')).toBe(true);
  });

  it('returns false for safe content', () => {
    expect(containsXSSPatterns('Normal transaction description')).toBe(false);
    expect(containsXSSPatterns('Grocery shopping - $50.00')).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("it's")).toBe('it&#x27;s');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('a/b')).toBe('a&#x2F;b');
  });

  it('handles multiple entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });
});

describe('removeControlChars', () => {
  it('removes null bytes', () => {
    expect(removeControlChars('test\x00text')).toBe('testtext');
  });

  it('removes other control characters', () => {
    expect(removeControlChars('test\x01\x02\x03text')).toBe('testtext');
  });

  it('preserves newlines and tabs', () => {
    expect(removeControlChars('line1\nline2\ttab')).toBe('line1\nline2\ttab');
  });

  it('preserves carriage returns', () => {
    expect(removeControlChars('line1\r\nline2')).toBe('line1\r\nline2');
  });
});

describe('sanitizeInput', () => {
  it('combines all sanitization steps', () => {
    const input = '  <script>alert(1)</script>\x00Test  ';
    expect(sanitizeInput(input)).toBe('Test');
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
  });

  it('handles complex XSS attempts', () => {
    const input =
      '<img src=x onerror="alert(\'XSS\')"><script>document.cookie</script>';
    expect(sanitizeInput(input)).toBe('');
  });
});
