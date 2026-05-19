import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressImage } from '../compressImage';

function smallImageFile(bytes: number, type = 'image/png'): File {
  return new File([new Uint8Array(bytes)], 'pic.png', { type });
}

describe('compressImage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('passes through non-image files', async () => {
    const file = new File([new Uint8Array(8)], 'movie.mp4', { type: 'video/mp4' });
    expect(await compressImage(file)).toBe(file);
  });

  it('passes through GIFs (animation preservation)', async () => {
    const file = smallImageFile(8 * 1024 * 1024, 'image/gif');
    expect(await compressImage(file)).toBe(file);
  });

  it('passes through images <= 2 MB threshold', async () => {
    const file = smallImageFile(1024 * 1024); // 1 MB
    expect(await compressImage(file)).toBe(file);
  });
});
