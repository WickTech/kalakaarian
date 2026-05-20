import { describe, it, expect } from 'vitest';
import { stripImageMetadata } from '../stripExif';

describe('stripImageMetadata', () => {
  it('passes through non-image files untouched', async () => {
    const file = new File([new Uint8Array(8)], 'movie.mp4', { type: 'video/mp4' });
    expect(await stripImageMetadata(file)).toBe(file);
  });

  it('passes through GIFs untouched (animation preservation)', async () => {
    const file = new File([new Uint8Array(8)], 'anim.gif', { type: 'image/gif' });
    expect(await stripImageMetadata(file)).toBe(file);
  });

  it('passes through files with no recognised type', async () => {
    const file = new File([new Uint8Array(8)], 'mystery', { type: '' });
    expect(await stripImageMetadata(file)).toBe(file);
  });
});
