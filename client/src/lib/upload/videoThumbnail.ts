export async function videoThumbnail(file: File, atSec = 0.1): Promise<string | undefined> {
  if (!file.type.startsWith('video/')) return undefined;
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        video.currentTime = Math.min(atSec, Math.max(0, (video.duration || atSec) - 0.01));
      };
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('seeked', () => resolve(), { once: true });
      video.addEventListener('error', () => reject(new Error('video decode failed')), { once: true });
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}
