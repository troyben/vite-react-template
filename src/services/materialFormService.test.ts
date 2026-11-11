import { expect, it } from 'vitest';
import { UNIT_OPTIONS, materialFormData, type MaterialFormValues } from './materialFormService';
const values: MaterialFormValues = { category: 'glass', unit: 'per_sqm', currency: 'USD', properties: {}, image: null };
it('includes an explicit null image for image-free materials and removals', () => {
  const form = new FormData(); form.set('name', ' Glass '); form.set('costPrice', '10.50');
  expect(materialFormData(form, values)).toEqual({ ...values, name: 'Glass', costPrice: 10.5, description: '' });
});
it('preserves the compressed image and usage rules when building a material payload', () => {
  const form = new FormData(); form.set('name', 'Glass'); form.set('costPrice', '10');
  const image = 'data:image/webp;base64,V0VCUA==';
  const properties = { applicableTo: 'window' as const, thickness: 4 };
  const result = materialFormData(form, { ...values, image, properties });
  expect(result.image).toBe(image); expect(result.properties).toEqual(properties);
});

it('offers millilitres and preserves silicone pricing and usage quantities in the saved payload', () => {
  expect(UNIT_OPTIONS.find(option => option.value === 'per_ml')?.label).toContain('ml');
  const form = new FormData(); form.set('name', 'Silicone'); form.set('costPrice', '0.05');
  const payload = materialFormData(form, { ...values, category: 'accessory', unit: 'per_ml',
    properties: { usageRule: { enabled: true, basis: 'perimeter', quantity: 10, wastagePercent: 0 } } });
  expect(payload.unit).toBe('per_ml'); expect(payload.costPrice).toBe(0.05);
  expect(payload.properties?.usageRule).toMatchObject({ quantity: 10 });
});
