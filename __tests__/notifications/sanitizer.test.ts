/**
 * Notification Sanitizer Tests
 *
 * Comprehensive security tests for XSS prevention in notification content.
 * Tests include common attack vectors: script tags, event handlers, javascript: URLs,
 * HTML injection, and encoded payloads.
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeTitle,
  sanitizeBody,
  sanitizeActionUrl,
  sanitizeMetadata,
  sanitizeNotificationContent,
  MAX_TITLE_LENGTH,
  MAX_BODY_LENGTH,
} from '@/lib/notifications/utils/sanitizer';

// ============================================
// Title Sanitization Tests
// ============================================

describe('sanitizeTitle', () => {
  it('should allow clean text without modification', () => {
    const result = sanitizeTitle('New Booking Request');
    expect(result.value).toBe('New Booking Request');
    expect(result.wasModified).toBe(false);
  });

  it('should strip <script> tags', () => {
    const result = sanitizeTitle('<script>alert("xss")</script>Booking');
    expect(result.value).toBe('alert(&quot;xss&quot;)Booking');
    expect(result.wasModified).toBe(true);
    expect(result.value).not.toContain('<script>');
    expect(result.value).not.toContain('</script>');
  });

  it('should strip inline event handlers', () => {
    const result = sanitizeTitle('<img src=x onerror=alert(1)>');
    expect(result.value).toBe('');
    expect(result.wasModified).toBe(true);
    expect(result.value).not.toContain('onerror');
  });

  it('should escape special HTML characters', () => {
    const result = sanitizeTitle('Price: 10€ & free < 100');
    // Special characters are properly escaped
    expect(result.value).toBe('Price: 10€ &amp; free &lt; 100');
    expect(result.wasModified).toBe(true);
  });

  it('should strip <style> tags', () => {
    const result = sanitizeTitle('<style>body{display:none}</style>Alert');
    expect(result.value).toBe('body{display:none}Alert');
    expect(result.wasModified).toBe(true);
  });

  it('should strip HTML comments', () => {
    const result = sanitizeTitle('<!-- malicious comment -->Title');
    expect(result.value).toBe('Title');
    expect(result.wasModified).toBe(true);
  });

  it('should truncate to MAX_TITLE_LENGTH', () => {
    const longTitle = 'A'.repeat(MAX_TITLE_LENGTH + 50);
    const result = sanitizeTitle(longTitle);
    expect(result.value.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(result.value).toMatch(/\.\.\.$/);
    expect(result.wasModified).toBe(true);
  });

  it('should trim whitespace', () => {
    const result = sanitizeTitle('   Spaced Title   ');
    expect(result.value).toBe('Spaced Title');
    expect(result.wasModified).toBe(true);
  });

  it('should handle empty string', () => {
    const result = sanitizeTitle('');
    expect(result.value).toBe('');
    expect(result.wasModified).toBe(false);
  });

  it('should escape single quotes', () => {
    const result = sanitizeTitle("It's a booking");
    expect(result.value).toBe('It&#x27;s a booking');
    expect(result.wasModified).toBe(true);
  });

  it('should escape double quotes', () => {
    const result = sanitizeTitle('Studio "Premium"');
    expect(result.value).toBe('Studio &quot;Premium&quot;');
    expect(result.wasModified).toBe(true);
  });

  it('should escape forward slashes', () => {
    const result = sanitizeTitle('Price: €50/hour');
    expect(result.value).toBe('Price: €50&#x2F;hour');
    expect(result.wasModified).toBe(true);
  });

  it('should handle complex XSS attempt with nested tags', () => {
    const result = sanitizeTitle('<div><script>alert(1)</script><img src=x></div>');
    expect(result.value).not.toContain('<');
    expect(result.value).not.toContain('>');
    expect(result.wasModified).toBe(true);
  });
});

// ============================================
// Body Sanitization Tests
// ============================================

describe('sanitizeBody', () => {
  it('should allow clean text without modification', () => {
    const result = sanitizeBody('Your booking at Studio ABC is confirmed.');
    expect(result.value).toBe('Your booking at Studio ABC is confirmed.');
    expect(result.wasModified).toBe(false);
  });

  it('should strip <script> tags', () => {
    const result = sanitizeBody('Message: <script>fetch("/steal")</script>Details');
    expect(result.value).toBe('Message: fetch(&quot;&#x2F;steal&quot;)Details');
    expect(result.wasModified).toBe(true);
  });

  it('should strip <iframe> tags', () => {
    const result = sanitizeBody('<iframe src="evil.com"></iframe>Content');
    expect(result.value).toBe('Content');
    expect(result.wasModified).toBe(true);
  });

  it('should strip multiple HTML tags', () => {
    const result = sanitizeBody('Text with <b>bold</b> and <i>italic</i> formatting');
    expect(result.value).toBe('Text with bold and italic formatting');
    expect(result.wasModified).toBe(true);
  });

  it('should truncate to MAX_BODY_LENGTH', () => {
    const longBody = 'B'.repeat(MAX_BODY_LENGTH + 100);
    const result = sanitizeBody(longBody);
    expect(result.value.length).toBeLessThanOrEqual(MAX_BODY_LENGTH);
    expect(result.value).toMatch(/\.\.\.$/);
    expect(result.wasModified).toBe(true);
  });

  it('should handle SVG XSS attack', () => {
    const result = sanitizeBody('<svg onload=alert(1)>');
    expect(result.value).toBe('');
    expect(result.wasModified).toBe(true);
  });

  it('should handle data URI XSS attempt in text', () => {
    const result = sanitizeBody('Click: data:text/html,<script>alert(1)</script>');
    expect(result.value).not.toContain('<script>');
    expect(result.wasModified).toBe(true);
  });
});

// ============================================
// Action URL Sanitization Tests
// ============================================

describe('sanitizeActionUrl', () => {
  it('should allow valid HTTPS URLs', () => {
    const url = 'https://example.com/booking/123';
    expect(sanitizeActionUrl(url)).toBe(url);
  });

  it('should allow valid HTTP URLs', () => {
    const url = 'http://localhost:3000/test';
    expect(sanitizeActionUrl(url)).toBe(url);
  });

  it('should allow relative paths', () => {
    expect(sanitizeActionUrl('/bookings/123')).toBe('/bookings/123');
    expect(sanitizeActionUrl('/app/studios/456')).toBe('/app/studios/456');
  });

  it('should allow mailto: links', () => {
    expect(sanitizeActionUrl('mailto:support@example.com')).toBe('mailto:support@example.com');
  });

  it('should allow tel: links', () => {
    expect(sanitizeActionUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  it('should allow sms: links', () => {
    expect(sanitizeActionUrl('sms:+1234567890')).toBe('sms:+1234567890');
  });

  it('should reject javascript: protocol', () => {
    expect(sanitizeActionUrl('javascript:alert("xss")')).toBeNull();
    expect(sanitizeActionUrl('JavaScript:alert(1)')).toBeNull(); // Case insensitive
    expect(sanitizeActionUrl('JAVASCRIPT:void(0)')).toBeNull();
  });

  it('should reject data: protocol', () => {
    expect(sanitizeActionUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeActionUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBeNull();
  });

  it('should reject vbscript: protocol', () => {
    expect(sanitizeActionUrl('vbscript:msgbox("xss")')).toBeNull();
  });

  it('should reject file: protocol', () => {
    expect(sanitizeActionUrl('file:///etc/passwd')).toBeNull();
  });

  it('should reject about: protocol', () => {
    expect(sanitizeActionUrl('about:blank')).toBeNull();
  });

  it('should reject URLs with HTML tags', () => {
    expect(sanitizeActionUrl('<script>alert(1)</script>https://example.com')).toBeNull();
    expect(sanitizeActionUrl('https://example.com<script>alert(1)</script>')).toBeNull();
  });

  it('should handle undefined', () => {
    expect(sanitizeActionUrl(undefined)).toBeNull();
  });

  it('should handle empty string', () => {
    expect(sanitizeActionUrl('')).toBeNull();
  });

  it('should handle whitespace-only string', () => {
    expect(sanitizeActionUrl('   ')).toBeNull();
  });

  it('should trim whitespace from valid URLs', () => {
    expect(sanitizeActionUrl('  /bookings/123  ')).toBe('/bookings/123');
  });

  it('should reject malformed URLs', () => {
    expect(sanitizeActionUrl('ht!tp://example.com')).toBeNull();
    // Protocol-relative URLs are rejected for security
    expect(sanitizeActionUrl('//example.com')).toBeNull();
  });
});

// ============================================
// Metadata Sanitization Tests
// ============================================

describe('sanitizeMetadata', () => {
  it('should sanitize string values', () => {
    const metadata = {
      studioName: '<script>alert(1)</script>Studio ABC',
      description: 'Test <b>HTML</b>',
    };

    const result = sanitizeMetadata(metadata);
    expect(result.studioName).toBe('alert(1)Studio ABC');
    expect(result.description).toBe('Test HTML');
  });

  it('should preserve non-string types', () => {
    const metadata = {
      price: 50,
      available: true,
      slots: null,
      rating: 4.5,
    };

    const result = sanitizeMetadata(metadata);
    expect(result.price).toBe(50);
    expect(result.available).toBe(true);
    expect(result.slots).toBeNull();
    expect(result.rating).toBe(4.5);
  });

  it('should recursively sanitize nested objects', () => {
    const metadata = {
      studio: {
        name: '<script>XSS</script>Studio',
        address: {
          street: 'Main <b>Street</b>',
          city: 'Berlin',
        },
      },
    };

    const result = sanitizeMetadata(metadata);
    expect((result.studio as any).name).toBe('XSSStudio');
    expect((result.studio as any).address.street).toBe('Main Street');
    expect((result.studio as any).address.city).toBe('Berlin');
  });

  it('should sanitize string arrays', () => {
    const metadata = {
      tags: ['<script>XSS</script>tag1', 'normal tag', '<b>bold</b> tag'],
    };

    const result = sanitizeMetadata(metadata);
    expect(result.tags).toEqual(['XSStag1', 'normal tag', 'bold tag']);
  });

  it('should handle arrays with mixed types', () => {
    const metadata = {
      mixed: ['<script>XSS</script>text', 123, true, null],
    };

    const result = sanitizeMetadata(metadata);
    expect(result.mixed).toEqual(['XSStext', 123, true, null]);
  });

  it('should sanitize nested objects in arrays', () => {
    const metadata = {
      items: [
        { name: '<script>XSS</script>Item 1' },
        { name: 'Item <b>2</b>' },
      ],
    };

    const result = sanitizeMetadata(metadata);
    expect((result.items as any)[0].name).toBe('XSSItem 1');
    expect((result.items as any)[1].name).toBe('Item 2');
  });

  it('should escape special characters in metadata values', () => {
    const metadata = {
      description: 'Price: 10€ & free < 100',
      note: "It's a test",
    };

    const result = sanitizeMetadata(metadata);
    // Special characters are properly escaped
    expect(result.description).toBe('Price: 10€ &amp; free &lt; 100');
    expect(result.note).toBe('It&#x27;s a test');
  });

  it('should handle empty objects', () => {
    const result = sanitizeMetadata({});
    expect(result).toEqual({});
  });

  it('should handle deeply nested structures', () => {
    const metadata = {
      level1: {
        level2: {
          level3: {
            dangerous: '<script>alert(1)</script>',
            safe: 'normal text',
          },
        },
      },
    };

    const result = sanitizeMetadata(metadata);
    expect((result.level1 as any).level2.level3.dangerous).toBe('alert(1)');
    expect((result.level1 as any).level2.level3.safe).toBe('normal text');
  });
});

// ============================================
// Complete Content Sanitization Tests
// ============================================

describe('sanitizeNotificationContent', () => {
  it('should sanitize all fields and detect modifications', () => {
    const content = {
      title: '<script>XSS</script>Booking',
      body: 'Your booking is <b>confirmed</b>!',
      actionUrl: 'javascript:alert(1)',
      metadata: {
        studioName: 'Studio <img src=x onerror=alert(1)>',
      },
    };

    const result = sanitizeNotificationContent(content);

    expect(result.title).toBe('XSSBooking');
    expect(result.body).toBe('Your booking is confirmed!');
    expect(result.actionUrl).toBeNull();
    expect(result.metadata?.studioName).toBe('Studio ');
    expect(result.wasModified).toBe(true);
  });

  it('should not mark as modified for clean content', () => {
    const content = {
      title: 'Clean Booking',
      body: 'Your booking is confirmed.',
      actionUrl: '/bookings/123',
      metadata: {
        studioName: 'Studio ABC',
        price: 50,
      },
    };

    const result = sanitizeNotificationContent(content);

    expect(result.title).toBe('Clean Booking');
    expect(result.body).toBe('Your booking is confirmed.');
    expect(result.actionUrl).toBe('/bookings/123');
    expect(result.metadata?.studioName).toBe('Studio ABC');
    expect(result.wasModified).toBe(false);
  });

  it('should handle partial content', () => {
    const result = sanitizeNotificationContent({
      title: 'Only Title',
    });

    expect(result.title).toBe('Only Title');
    expect(result.body).toBeUndefined();
    expect(result.actionUrl).toBeNull();
    expect(result.metadata).toBeUndefined();
    expect(result.wasModified).toBe(false);
  });

  it('should handle all fields undefined', () => {
    const result = sanitizeNotificationContent({});

    expect(result.title).toBeUndefined();
    expect(result.body).toBeUndefined();
    expect(result.actionUrl).toBeNull();
    expect(result.metadata).toBeUndefined();
    expect(result.wasModified).toBe(false);
  });

  it('should detect modification if only actionUrl is dangerous', () => {
    const content = {
      title: 'Clean Title',
      body: 'Clean Body',
      actionUrl: 'javascript:alert(1)',
    };

    const result = sanitizeNotificationContent(content);
    expect(result.wasModified).toBe(true);
  });

  it('should handle complex XSS attack scenario', () => {
    const content = {
      title: '<img src=x onerror=alert(document.cookie)>',
      body: '<iframe src="javascript:alert(1)"></iframe>',
      actionUrl: 'data:text/html,<script>alert(1)</script>',
      metadata: {
        user: {
          name: '<svg onload=alert(1)>',
          bio: 'Normal<script>Evil</script>Bio',
        },
        tags: ['<script>XSS1</script>', '<script>XSS2</script>'],
      },
    };

    const result = sanitizeNotificationContent(content);

    // All malicious content should be stripped
    expect(result.title).not.toContain('<');
    expect(result.title).not.toContain('onerror');
    expect(result.body).not.toContain('<iframe');
    expect(result.actionUrl).toBeNull();
    expect((result.metadata?.user as any)?.name).not.toContain('<svg');
    expect((result.metadata?.user as any)?.bio).not.toContain('<script>');
    expect(result.metadata?.tags).toEqual(['XSS1', 'XSS2']);
    expect(result.wasModified).toBe(true);
  });
});

// ============================================
// Edge Cases and Real-World Scenarios
// ============================================

describe('Edge Cases', () => {
  it('should handle unicode characters correctly', () => {
    const result = sanitizeTitle('Café ☕ Réservation');
    expect(result.value).toBe('Café ☕ Réservation');
    expect(result.wasModified).toBe(false);
  });

  it('should handle emoji in notifications', () => {
    const result = sanitizeBody('Your booking is confirmed! 🎉🎊');
    expect(result.value).toBe('Your booking is confirmed! 🎉🎊');
    expect(result.wasModified).toBe(false);
  });

  it('should handle German special characters', () => {
    const result = sanitizeBody('Buchung bei Frisör für Haarschnitt bestätigt');
    expect(result.value).toBe('Buchung bei Frisör für Haarschnitt bestätigt');
    expect(result.wasModified).toBe(false);
  });

  it('should handle URL encoding in metadata', () => {
    const metadata = {
      url: '/booking/123?param=value&other=test',
    };

    const result = sanitizeMetadata(metadata);
    expect(result.url).toBe('&#x2F;booking&#x2F;123?param=value&amp;other=test');
  });

  it('should handle very long XSS payloads', () => {
    const longPayload = '<script>' + 'A'.repeat(1000) + '</script>';
    const result = sanitizeTitle(longPayload);
    expect(result.value).not.toContain('<script>');
    expect(result.value.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });

  it('should handle null-byte injection attempts', () => {
    const result = sanitizeTitle('Title\x00<script>alert(1)</script>');
    expect(result.value).not.toContain('<script>');
  });

  it('should handle HTML entity encoded XSS', () => {
    const result = sanitizeTitle('&lt;script&gt;alert(1)&lt;/script&gt;');
    // After stripping (no HTML tags) and escaping
    expect(result.value).toBe('&amp;lt;script&amp;gt;alert(1)&amp;lt;&#x2F;script&amp;gt;');
  });
});

// ============================================
// Real-World Attack Vectors
// ============================================

describe('Real-World Attack Vectors', () => {
  it('should prevent cookie stealing attempt', () => {
    const result = sanitizeBody(
      '<img src=x onerror="fetch(\'/steal?cookie=\'+document.cookie)">'
    );
    expect(result.value).not.toContain('onerror');
    expect(result.value).not.toContain('fetch');
  });

  it('should prevent DOM-based XSS', () => {
    const result = sanitizeActionUrl('javascript:void(document.body.innerHTML="<h1>Hacked</h1>")');
    expect(result).toBeNull();
  });

  it('should prevent reflected XSS in metadata', () => {
    const metadata = {
      searchQuery: '<script>alert(document.domain)</script>',
    };

    const result = sanitizeMetadata(metadata);
    expect(result.searchQuery).not.toContain('<script>');
    expect(result.searchQuery).toBe('alert(document.domain)');
  });

  it('should prevent SVG-based XSS', () => {
    const result = sanitizeBody(
      '<svg><script>alert("XSS")</script></svg>'
    );
    expect(result.value).not.toContain('<svg>');
    expect(result.value).not.toContain('<script>');
  });

  it('should prevent event handler injection', () => {
    const handlers = [
      'onload=alert(1)',
      'onerror=alert(1)',
      'onclick=alert(1)',
      'onmouseover=alert(1)',
      'onfocus=alert(1)',
    ];

    handlers.forEach((handler) => {
      const result = sanitizeTitle(`<img ${handler}>`);
      expect(result.value).not.toContain(handler.split('=')[0]);
    });
  });

  it('should prevent CSS-based attacks', () => {
    const result = sanitizeBody(
      '<style>body{background:url("javascript:alert(1)")}</style>'
    );
    expect(result.value).not.toContain('<style>');
    // The javascript: URL is escaped to prevent execution
    expect(result.value).toContain('&quot;');
    // After stripping <style> tags and escaping quotes, we get the CSS content escaped
    expect(result.value).toBe('body{background:url(&quot;javascript:alert(1)&quot;)}');
  });
});
