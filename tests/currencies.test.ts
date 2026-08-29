import { describe, it, expect } from 'vitest';
import { SvgSanitizer } from '../src/lib/svg-sanitizer';

describe('Currency & SVG Sanitizer Security Engine', () => {
  it('should accept and clean well-formed SVG currency icons', () => {
    const validSvg = '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#c23c4e"/><text x="12" y="16" text-anchor="middle" fill="#fff">৳</text></svg>';
    expect(SvgSanitizer.isValid(validSvg)).toBe(true);
    const sanitized = SvgSanitizer.sanitize(validSvg);
    expect(sanitized).toContain('<svg');
    expect(sanitized).toContain('</svg>');
  });

  it('should strictly reject SVG markup containing <script> tags', () => {
    const maliciousSvg = '<svg viewBox="0 0 24 24"><script>alert("XSS")</script><circle cx="12" cy="12" r="10"/></svg>';
    expect(SvgSanitizer.isValid(maliciousSvg)).toBe(false);
    expect(() => SvgSanitizer.sanitize(maliciousSvg)).toThrowError(/<script> elements are strictly forbidden/);
  });

  it('should strictly reject inline JavaScript event handlers in SVG', () => {
    const maliciousSvg = '<svg viewBox="0 0 24 24" onload="window.location=\'https://attacker.com\'"><circle cx="12" cy="12" r="10"/></svg>';
    expect(SvgSanitizer.isValid(maliciousSvg)).toBe(false);
    expect(() => SvgSanitizer.sanitize(maliciousSvg)).toThrowError(/Inline JavaScript event handlers are forbidden/);
  });

  it('should strictly reject javascript: URIs in xlink/href', () => {
    const maliciousSvg = '<svg viewBox="0 0 24 24"><a href="javascript:alert(document.cookie)"><text>Click</text></a></svg>';
    expect(SvgSanitizer.isValid(maliciousSvg)).toBe(false);
    expect(() => SvgSanitizer.sanitize(maliciousSvg)).toThrowError(/JavaScript execution URIs are forbidden/);
  });
});
