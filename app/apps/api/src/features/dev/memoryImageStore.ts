import type { ImageKey, ImageStore } from '../../lib/imageRoutes.ts';

/**
 * In-memory {@link ImageStore} for the dev server and unit tests (no Oracle). `exists` says which
 * keys have a row; the bytes live in a Map keyed by the key's JSON.
 */
export function memoryImageStore(opts: {
  exists: (key: ImageKey) => boolean | Promise<boolean>;
}): ImageStore {
  const images = new Map<string, Buffer>();
  const id = (key: ImageKey) => JSON.stringify(key);
  return {
    get: async (key) => images.get(id(key)) ?? null,
    set: async (key, data) => {
      if (!(await opts.exists(key))) return false;
      images.set(id(key), data);
      return true;
    },
    clear: async (key) => {
      if (!(await opts.exists(key))) return false;
      images.delete(id(key));
      return true;
    },
  };
}
