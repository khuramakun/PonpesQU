export function compressImageFile(file: File, maxDim = 300, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      if (!rawUrl) {
        reject(new Error("File empty"));
        return;
      }
      compressDataUrl(rawUrl, maxDim, quality)
        .then(resolve)
        .catch(() => resolve(rawUrl));
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function compressDataUrl(rawUrl: string, maxDim = 300, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    if (!rawUrl || !rawUrl.startsWith("data:image/")) {
      resolve(rawUrl);
      return;
    }
    // If string is already small (< 30KB), return as is
    if (rawUrl.length < 30000) {
      resolve(rawUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(rawUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch (e) {
        resolve(rawUrl);
      }
    };
    img.onerror = () => resolve(rawUrl);
    img.src = rawUrl;
  });
}
