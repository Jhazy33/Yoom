// IndexedDB Storage Module for Recording Management
// Database: yoom-recordings, Store: recordings

export interface RecordingMetadata {
  videoId: string;
  title: string;
  createdAt: string;
  size: number;
  duration: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadAttempts: number;
  lastUploadAttempt?: string;
  errorMessage?: string;
  r2Key?: string;
}

interface RecordingWithBlob extends RecordingMetadata {
  blob: Blob;
}

const DB_NAME = 'yoom-recordings';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB database and create object store with indexes
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object store with videoId as key path
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'videoId' });

        // Create indexes for querying
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Save recording blob and metadata to IndexedDB
 */
export async function saveRecording(
  videoId: string,
  blob: Blob,
  metadata: Omit<RecordingMetadata, 'videoId'>
): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const recording: RecordingWithBlob = {
      videoId,
      blob,
      ...metadata,
    };

    const request = store.put(recording);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save recording: ${request.error?.message}`));
  });
}

/**
 * Get all recordings with metadata (excluding blobs)
 */
export async function getRecordings(): Promise<RecordingMetadata[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const recordings = request.result as RecordingWithBlob[];
      // Return metadata without blobs for listing
      const metadata: RecordingMetadata[] = recordings.map(({ blob, ...rest }) => rest);
      resolve(metadata);
    };

    request.onerror = () => reject(new Error(`Failed to get recordings: ${request.error?.message}`));
  });
}

/**
 * Delete a recording by videoId
 */
export async function deleteRecording(videoId: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(videoId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete recording: ${request.error?.message}`));
  });
}

/**
 * Update recording status and optional extra data
 */
export async function updateRecordingStatus(
  videoId: string,
  status: RecordingMetadata['status'],
  extraData?: Partial<Omit<RecordingMetadata, 'videoId' | 'status'>>
): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(videoId);

    getReq.onsuccess = () => {
      const recording = getReq.result as RecordingWithBlob | undefined;

      if (!recording) {
        reject(new Error(`Recording not found: ${videoId}`));
        return;
      }

      // Update status and extra fields
      recording.status = status;
      if (extraData) {
        Object.assign(recording, extraData);
      }

      // Increment upload attempts for failed status
      if (status === 'failed') {
        recording.uploadAttempts = (recording.uploadAttempts || 0) + 1;
        recording.lastUploadAttempt = new Date().toISOString();
      }

      const putReq = store.put(recording);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(new Error(`Failed to update recording: ${putReq.error?.message}`));
    };

    getReq.onerror = () => reject(new Error(`Failed to get recording: ${getReq.error?.message}`));
  });
}

/**
 * Get only failed recordings for retry logic
 */
export async function getFailedUploads(): Promise<RecordingMetadata[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.getAll('failed');

    request.onsuccess = () => {
      const recordings = request.result as RecordingWithBlob[];
      const metadata: RecordingMetadata[] = recordings.map(({ blob, ...rest }) => rest);
      resolve(metadata);
    };

    request.onerror = () => reject(new Error(`Failed to get failed uploads: ${request.error?.message}`));
  });
}

/**
 * Retrieve recording blob for upload
 */
export async function getRecordingBlob(videoId: string): Promise<Blob> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(videoId);

    request.onsuccess = () => {
      const recording = request.result as RecordingWithBlob | undefined;

      if (!recording) {
        reject(new Error(`Recording not found: ${videoId}`));
        return;
      }

      resolve(recording.blob);
    };

    request.onerror = () => reject(new Error(`Failed to get recording blob: ${request.error?.message}`));
  });
}

/**
 * Clear all recordings (useful for testing or cleanup)
 */
export async function clearAllRecordings(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to clear recordings: ${request.error?.message}`));
  });
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{ count: number; totalSize: number }> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const recordings = request.result as RecordingWithBlob[];
      const count = recordings.length;
      const totalSize = recordings.reduce((sum, r) => sum + r.size, 0);
      resolve({ count, totalSize });
    };

    request.onerror = () => reject(new Error(`Failed to get storage stats: ${request.error?.message}`));
  });
}
