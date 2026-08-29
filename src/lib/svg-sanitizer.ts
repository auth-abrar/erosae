/**
 * SVG Sanitizer for Custom Currency Icons and Badges
 *
 * Strips script tags, event handlers (onload, onerror, etc.), iframes, and javascript: links
 * to protect against stored XSS attacks when business owners upload custom SVG currency icons.
 */

export class SvgSanitizer {
  /**
   * Sanitizes an SVG string. Returns clean SVG markup or throws an error if dangerous vectors are found.
   */
  static sanitize(rawSvg: string): string {
    if (!rawSvg || typeof rawSvg !== 'string') {
      return '';
    }

    let cleaned = rawSvg.trim();

    // 1. Must contain valid <svg tag
    if (!/<svg[\s\S]*?>[\s\S]*?<\/svg>/i.test(cleaned)) {
      throw new Error('Invalid SVG markup: Missing <svg> root element.');
    }

    // 2. Reject scripts
    if (/<script[\s\S]*?>[\s\S]*?<\/script>/i.test(cleaned) || /<script/i.test(cleaned)) {
      throw new Error('Dangerous SVG: <script> elements are strictly forbidden.');
    }

    // 3. Reject event handlers (e.g. onload, onclick, onerror, onmouseover)
    const eventHandlerRegex = /\s*on[a-zA-Z]+\s*=\s*["'][^"']*["']/gi;
    if (eventHandlerRegex.test(cleaned)) {
      throw new Error('Dangerous SVG: Inline JavaScript event handlers are forbidden.');
    }

    // 4. Reject javascript: or data: URIs in href / xlink:href
    if (/href\s*=\s*["']\s*(javascript|data):/i.test(cleaned)) {
      throw new Error('Dangerous SVG: JavaScript execution URIs are forbidden.');
    }

    // 5. Reject foreignObject, iframe, object, embed
    const dangerousTags = ['foreignObject', 'iframe', 'object', 'embed', 'applet', 'meta', 'link'];
    for (const tag of dangerousTags) {
      const tagRegex = new RegExp(`<${tag}[\\s\\S]*?>`, 'i');
      if (tagRegex.test(cleaned)) {
        throw new Error(`Dangerous SVG: <${tag}> elements are forbidden.`);
      }
    }

    return cleaned;
  }

  /**
   * Validates whether an SVG string is clean without throwing.
   */
  static isValid(rawSvg: string): boolean {
    try {
      SvgSanitizer.sanitize(rawSvg);
      return true;
    } catch {
      return false;
    }
  }
}
