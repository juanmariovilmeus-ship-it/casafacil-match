/**
 * Utility to compress and resize images on the client-side using HTML5 Canvas.
 * This prevents localStorage QuotaExceededError when storing multiple photos.
 */
export function compressImage(
  fileOrBase64: File | string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping the aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original if canvas context cannot be created
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as JPEG with lower quality to drastically reduce size in bytes
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = (err) => {
        // Fallback to original if load fails
        resolve(src);
      };

      img.src = src;
    };

    if (fileOrBase64 instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          processImage(reader.result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(fileOrBase64);
    } else {
      processImage(fileOrBase64);
    }
  });
}

/**
 * Safely writes to localStorage wrapping it in a try-catch to prevent crash
 * if the browser quota continues to fail for any reason.
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`localStorage error saving key "${key}":`, error);
    
    // Attempt cleaning older local items if storage gets completely full
    try {
      // Run emergency force cleanup immediately to reclaim space
      cleanupLocalStorageData(true);

      // Try one last time after clean-up
      localStorage.setItem(key, value);
      return true;
    } catch (innerErr) {
      console.error('Failed to save to localStorage even after emergency clean-up:', innerErr);
      return false;
    }
  }
}

/**
 * Periodically or forcefully cleans up localStorage.
 * - Removes properties marked with 'indisponivel' (inactive).
 * - Discards secondary high-res uploaded_images of properties older than 3 days to free up to 90% space.
 * - Entirely removes local properties older than 14 days.
 */
export function cleanupLocalStorageData(force = false): void {
  const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  const lastCleanupStr = localStorage.getItem('casafacil_last_cleanup');
  const now = Date.now();

  if (!force && lastCleanupStr) {
    const timeSinceLast = now - Number(lastCleanupStr);
    if (timeSinceLast < CLEANUP_INTERVAL_MS) {
      // Re-run not needed yet
      return;
    }
  }

  try {
    const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
    const localAddedString = localStorage.getItem('casafacil_local_added_properties') || '[]';
    let localAdded: any[] = [];
    try {
      localAdded = JSON.parse(localAddedString);
    } catch (e) {
      localAdded = [];
    }

    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

    const updatedMetadata: Record<string, any> = {};
    let metadataChanged = false;

    // 1. Filter and clean extended metadata
    for (const propId in extendedMetadata) {
      if (Object.prototype.hasOwnProperty.call(extendedMetadata, propId)) {
        const meta = extendedMetadata[propId];
        let keep = true;

        if (!meta) {
          keep = false;
          metadataChanged = true;
          continue;
        }

        // Deletion criteria 1: Inactive properties (indisponivel)
        if (meta.status === 'indisponivel') {
          keep = false;
          metadataChanged = true;
          console.log(`[CleanUp] Removendo metadados de imóvel indisponível: ${propId}`);
          continue;
        }

        // Deletion criteria 2: Parse creation timestamp for custom local properties ('prop-1234455...')
        if (propId.startsWith('prop-')) {
          const timestamp = Number(propId.replace('prop-', ''));
          if (!isNaN(timestamp)) {
            const age = now - timestamp;
            if (age > FOURTEEN_DAYS) {
              // Delete complete listing if it's over 14 days old
              keep = false;
              metadataChanged = true;
              console.log(`[CleanUp] Removendo imóvel local antigo (14d+): ${propId}`);
              continue;
            } else if (age > THREE_DAYS && meta.uploaded_images && meta.uploaded_images.length > 0) {
              // Discard heavy secondary slideshow photos, keeping the listing with primary photo
              meta.uploaded_images = [];
              metadataChanged = true;
              console.log(`[CleanUp] Otimizando espaço: removidas fotos antigas (3d+) do imóvel ${propId}`);
            }
          }
        }

        if (keep) {
          updatedMetadata[propId] = meta;
        }
      }
    }

    // 2. Filter local properties list synchronously with metadata state
    const originalCount = localAdded.length;
    const filteredLocalAdded = localAdded.filter((im: any) => {
      if (!im || !im.id) return false;

      // If status is metadata-defined as 'indisponivel' or deleted
      if (!updatedMetadata[im.id] && extendedMetadata[im.id]?.status === 'indisponivel') {
        return false;
      }

      if (im.id.startsWith('prop-')) {
        const timestamp = Number(im.id.replace('prop-', ''));
        if (!isNaN(timestamp)) {
          const age = now - timestamp;
          if (age > FOURTEEN_DAYS) {
            return false;
          } else if (age > THREE_DAYS && im.uploaded_images && im.uploaded_images.length > 0) {
            im.uploaded_images = [];
          }
        }
      }

      return true;
    });

    // Save changes if any
    if (metadataChanged || force) {
      localStorage.setItem('casafacil_extended_metadata', JSON.stringify(updatedMetadata));
    }

    if (filteredLocalAdded.length !== originalCount || force) {
      localStorage.setItem('casafacil_local_added_properties', JSON.stringify(filteredLocalAdded));
    }

    // Update cleanup timestamp status
    localStorage.setItem('casafacil_last_cleanup', String(now));
    console.log('[CleanUp] Faxina periódica do localStorage realizada com sucesso.');
  } catch (err) {
    console.error('[CleanUp] Erro na rotina de coleta de lixo do localStorage:', err);
  }
}
