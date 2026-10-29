import { expect, it } from 'vitest';
import { materialFormData, type MaterialFormValues } from './materialFormService';
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
