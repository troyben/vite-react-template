import { expect, it, vi } from 'vitest';
import jsPDF from 'jspdf';
import { drawSummary } from './summary';
import { PAGE, FOOTER_HEIGHT } from './constants';

it('prints the discount exactly once and the reduced final total in the exported PDF', () => {
  const doc = new jsPDF();
  const text = vi.spyOn(doc, 'text');
  drawSummary(doc, [], { subtotal: 200, vatPercent: 15, transportFee: 10, discountAmount: 25 }, 80);
  const labels = text.mock.calls.map(call => call[0]);
  expect(labels.filter(label => label === 'Discount:')).toHaveLength(1);
  expect(labels).toContain('-$25.00'); expect(labels).toContain('$215.00');
  expect(doc.output()).toContain('(Discount:)');
});
it('moves the entire discount summary to a new page when it would reach the footer', () => {
  const doc = new jsPDF();
  const text = vi.spyOn(doc, 'text');
  drawSummary(doc, [], { subtotal: 200, vatPercent: 15, transportFee: 10, discountAmount: 300 }, 230);
  expect(doc.getNumberOfPages()).toBe(2);
  expect(text.mock.calls.map(call => call[0])).toContain('$0.00');
  for (const call of text.mock.calls) {
    expect(Number(call[1])).toBeLessThanOrEqual(PAGE.width - PAGE.margin);
    expect(Number(call[2])).toBeLessThan(PAGE.height - FOOTER_HEIGHT);
  }
});
it('keeps zero-discount legacy PDFs unchanged without a discount row', () => {
  const doc = new jsPDF(); const text = vi.spyOn(doc, 'text');
  drawSummary(doc, [], { subtotal: 200, vatPercent: 15, transportFee: 10 }, 80);
  expect(text.mock.calls.map(call => call[0])).not.toContain('Discount:');
  expect(text.mock.calls.map(call => call[0])).toContain('$240.00');
});
