const { expect, test } = require('@playwright/test');
const { render } = require('../../src/helpers/har-viewer');

const HAR = `{"log":{"version":"1.2","entries":[{"startedDateTime":"2026-01-01T00:00:00.000Z","time":50,"request":{"method":"GET","url":"https://example.com/","headers":[{"name":"Accept","value":"*/*"}]},"response":{"status":200,"statusText":"OK","headers":[{"name":"Content-Type","value":"text/html"}],"content":{"size":42,"mimeType":"text/html"}},"timings":{"wait":40,"receive":10}}]}}`;

test.describe('HAR viewer', { tag: ['@infra', '@infra_frontend'] }, () => {
  test('renderBuildsSelenoidLikeTableWithDetailsWithoutEmbeddedHarDataUri', () => {
    const html = render(HAR);
    expect(html).toContain('HAR Viewer');
    expect(html).toContain('1 requests');
    expect(html).toContain('example.com');
    expect(html).toContain('<table class="har-table"');
    expect(html).toContain('>Method</span>');
    expect(html).toContain('>Status</span>');
    expect(html).toContain('>Type</span>');
    expect(html).not.toContain('cols-head');
    expect(html).not.toContain('Waterfall');
    expect(html).not.toContain('har-detail-row');
    expect(html).not.toContain('Details — Headers');
    expect(html).toContain('<details');
    expect(html).not.toContain('<details open');
    expect(html.split('<tr class="har-row"').length - 1).toBe(1);
    expect(html).toContain('Response Headers');
    expect(html).toContain('Request Headers');
    expect(html).toContain('Content-Type');
    expect(html).toContain('Accept');
    expect(html).toContain('capture.har');
    expect(html).toContain('border-collapse:collapse');
    expect(html).not.toContain('data:application/json;base64,');
    expect(html).not.toContain('__CONTENT__');
    expect(html).not.toContain('__SUMMARY__');
  });
});
