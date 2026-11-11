// @vitest-environment jsdom
import { useState, act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { QuotationTotals } from './QuotationTotals';
import QuotationPDFPreview from '../QuotationPDFPreview';
vi.mock('@/components/product-editor/canvas/ShapeCanvas', () => ({ default: () => <svg /> }));

it('recalculates the editor total when a fixed discount is entered and cleared', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement('div'); const root = createRoot(container);
  const Editor = () => {
    const [discount, setDiscount] = useState(0);
    return <QuotationTotals subtotal={200} vatPercent={15} transportFee={10} discountAmount={discount}
      onChange={values => setDiscount(values.discount_amount ?? discount)} />;
  };
  try {
    await act(() => root.render(<Editor />));
    const field = container.querySelector<HTMLInputElement>('#discount_amount')!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    const enter = async (value: string) => act(() => { setValue.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); });
    await enter('25'); expect(container.textContent).toContain('$215.00');
    await enter(''); expect(container.textContent).toContain('$240.00');
    await enter('300'); expect(container.textContent).toContain('$0.00');
  } finally { await act(() => root.unmount()); }
});
it('shows a single fixed discount row and reduced total in the customer preview', () => {
  const html = renderToStaticMarkup(<QuotationPDFPreview clientName="Client" items={[]} totalAmount={200} vatPercent={15} transportFee={10} discountAmount={25} />);
  expect(html.match(/Discount:/g)).toHaveLength(1);
  expect(html).toContain('−$25.00'); expect(html).toContain('$215.00');
  const saved = renderToStaticMarkup(<QuotationTotals subtotal={200} vatPercent={15} transportFee={10} discountAmount={25} />);
  expect(saved).toContain('$215.00'); expect(saved).toContain('readOnly');
});
