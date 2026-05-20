// Upload Queue Management with Automatic Retry Logic
// Handles background processing of failed uploads with exponential backoff

import { updateRecordingStatus, getRecordingBlob, getFailedUploads } from './storage';

export interface QueueItem {
  videoId: string;
  attempts: number;
  lastAttempt?: number;
  nextRetry?: number;
}

const QUEUE_KEY = 'yoom-upload-queue';
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 5000; // 5 seconds
const RETRY_MULTIPLIER = 1.5;

let queue: Map<string, QueueItem> = new Map();
let isProcessing = false;
let processingTimer: NodeJS.Timeout | null = null;

/**
 * Load queue from localStorage
 */
function loadQueue(): void {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (stored) {
      const items = JSON.parse(stored) as QueueItem[];
      queue = new Map(items.map(item => [item.videoId, item]));
    }
  } catch (error) {
    console.error('[Yoom UploadQueue] Failed to load queue:', error);
    queue = new Map();
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(): void {
  try {
    const items = Array.from(queue.values());
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[Yoom UploadQueue] Failed to save queue:', error);
  }
}

/**
 * Add item to upload queue
 */
export async function addToQueue(videoId: string, attempts: number = 0): Promise<void> {
  loadQueue();

  const item: QueueItem = {
    videoId,
    attempts: attempts + 1,
    lastAttempt: Date.now(),
    nextRetry: Date.now() + (BASE_RETRY_DELAY * Math.pow(RETRY_MULTIPLIER, attempts)),
  };

  queue.set(videoId, item);
  saveQueue();

  console.log(`[Yoom UploadQueue] Added ${videoId} to queue (attempt ${item.attempts})`);

  // Start processor if not already running
  if (!isProcessing) {
    startQueueProcessor();
  }
}

/**
 * Remove item from queue
 */
export function removeFromQueue(videoId: string): void {
  queue.delete(videoId);
  saveQueue();
  console.log(`[Yoom UploadQueue] Removed ${videoId} from queue`);
}

/**
 * Get current queue size
 */
export function getQueueSize(): number {
  loadQueue();
  return queue.size;
}

/**
 * Process a single upload attempt
 */
async function processUpload(videoId: string): Promise<boolean> {
  try {
    console.log(`[Yoom UploadQueue] Processing upload for ${videoId}`);

    // Update status to uploading
    await updateRecordingStatus(videoId, 'uploading');

    // Get blob from IndexedDB
    const blob = await getRecordingBlob(videoId);

    // Get upload URL from server
    const res = await fetch('/api/upload', {
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error(`Failed to get upload URL: ${res.status}`);
    }

    const { url: presignedUrl, key } = await res.json();

    // Upload to R2
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', 'video/webm');

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.status}`));
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(blob);
    });

    // Success - update status
    await updateRecordingStatus(videoId, 'completed', {
      r2Key: key,
      uploadAttempts: queue.get(videoId)?.attempts || 0,
    });

    console.log(`[Yoom UploadQueue] Successfully uploaded ${videoId}`);
    return true;

  } catch (error) {
    console.error(`[Yoom UploadQueue] Upload failed for ${videoId}:`, error);

    // Determine error type
    let errorMessage = 'Upload failed';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error - check your connection';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'Permission denied - R2 access error';
      }
    }

    // Update status to failed with error message
    await updateRecordingStatus(videoId, 'failed', {
      errorMessage,
      lastUploadAttempt: new Date().toISOString(),
    });

    return false;
  }
}

/**
 * Start background queue processor
 */
export function startQueueProcessor(): void {
  if (isProcessing) {
    console.log('[Yoom UploadQueue] Processor already running');
    return;
  }

  console.log('[Yoom UploadQueue] Starting queue processor');
  isProcessing = true;
  loadQueue();

  async function processQueue() {
    const now = Date.now();
    const readyItems: string[] = [];

    // Find items ready for retry
    for (const [videoId, item] of queue.entries()) {
      if (item.nextRetry && item.nextRetry <= now) {
        readyItems.push(videoId);
      }
    }

    if (readyItems.length === 0) {
      // No items ready, check again in 1 second
      processingTimer = setTimeout(processQueue, 1000);
      return;
    }

    // Process ready items
    for (const videoId of readyItems) {
      const item = queue.get(videoId);
      if (!item) continue;

      // Check if max attempts reached
      if (item.attempts >= MAX_RETRY_ATTEMPTS) {
        console.log(`[Yoom UploadQueue] Max attempts reached for ${videoId}, removing from queue`);
        removeFromQueue(videoId);
        continue;
      }

      // Attempt upload
      const success = await processUpload(videoId);

      if (success) {
        // Remove from queue on success
        removeFromQueue(videoId);
      } else {
        // Increment attempts and schedule retry
        const updatedItem: QueueItem = {
          ...item,
          attempts: item.attempts + 1,
          lastAttempt: Date.now(),
          nextRetry: Date.now() + (BASE_RETRY_DELAY * Math.pow(RETRY_MULTIPLIER, item.attempts)),
        };

        queue.set(videoId, updatedItem);
        saveQueue();

        // Remove from queue if max attempts reached
        if (updatedItem.attempts >= MAX_RETRY_ATTEMPTS) {
          console.log(`[Yoom UploadQueue] Max attempts reached for ${videoId}, removing from queue`);
          removeFromQueue(videoId);
        }
      }
    }

    // Continue processing if queue not empty
    if (queue.size > 0) {
      processingTimer = setTimeout(processQueue, 1000);
    } else {
      console.log('[Yoom UploadQueue] Queue empty, stopping processor');
      isProcessing = false;
    }
  }

  // Start processing
  processQueue();
}

/**
 * Stop queue processor
 */
export function stopQueueProcessor(): void {
  if (processingTimer) {
    clearTimeout(processingTimer);
    processingTimer = null;
  }
  isProcessing = false;
  console.log('[Yoom UploadQueue] Stopped queue processor');
}

/**
 * Get queue status for UI display
 */
export function getQueueStatus(): { size: number; processing: boolean } {
  return {
    size: getQueueSize(),
    processing: isProcessing,
  };
}

/**
 * Retry all failed uploads (manual trigger)
 */
export async function retryFailedUploads(): Promise<void> {
  console.log('[Yoom UploadQueue] Manually retrying failed uploads');

  try {
    const failedUploads = await getFailedUploads();

    for (const upload of failedUploads) {
      if (upload.uploadAttempts < MAX_RETRY_ATTEMPTS) {
        await addToQueue(upload.videoId, upload.uploadAttempts);
      }
    }

    // Start processor if not running
    if (!isProcessing && queue.size > 0) {
      startQueueProcessor();
    }
  } catch (error) {
    console.error('[Yoom UploadQueue] Failed to retry uploads:', error);
  }
}
