import { beforeEach, describe, expect, it, vi } from 'vitest';
import imageCompression from 'browser-image-compression';
import { compressMaterialImage, MAX_MATERIAL_IMAGE_BYTES } from './materialImageService';
vi.mock('browser-image-compression', () => ({ default: Object.assign(vi.fn(), { getDataUrlFromFile: vi.fn() }) }));
const compress = vi.mocked(imageCompression);
const encode = vi.mocked(imageCompression.getDataUrlFromFile);
const file = (type = 'image/png', size = 20) => new File([new Uint8Array(size)], 'material.png', { type });
beforeEach(() => { vi.resetAllMocks(); });
describe('material image compression', () => {
  it('compresses and resizes locally before base64 encoding the resulting file', async () => {
    const input = file(), output = file('image/webp', 10);
    compress.mockResolvedValue(output); encode.mockResolvedValue('data:image/webp;base64,V0VCUA==');
    expect(await compressMaterialImage(input)).toBe('data:image/webp;base64,V0VCUA==');
    expect(compress).toHaveBeenCalledWith(input, expect.objectContaining({ maxSizeMB: 0.25, maxWidthOrHeight: 1200, fileType: 'image/webp', useWebWorker: false }));
    expect(encode).toHaveBeenCalledWith(output);
  });
  it('rejects unsupported, empty and oversized inputs before compression', async () => {
    for (const input of [file('image/svg+xml'), file('image/png', 0), file('image/png', 10 * 1024 * 1024 + 1)]) {
      await expect(compressMaterialImage(input)).rejects.toThrow();
    }
    expect(compress).not.toHaveBeenCalled();
  });
  it('keeps oversized compression results and cancelled work out of saved data', async () => {
    compress.mockResolvedValue(file('image/webp', MAX_MATERIAL_IMAGE_BYTES + 1));
    await expect(compressMaterialImage(file())).rejects.toThrow('256 KB');
    const signal = new AbortController(); signal.abort();
    compress.mockResolvedValue(file('image/webp', 10));
    await expect(compressMaterialImage(file(), signal.signal)).rejects.toThrow('cancelled');
    expect(encode).not.toHaveBeenCalled();
  });
});
