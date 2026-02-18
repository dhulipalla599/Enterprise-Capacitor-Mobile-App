// composables/useOfflineSync.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { Network } from '@capacitor/network';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string; // e.g., 'inspections', 'devices', 'reports'
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

interface OfflineSyncDB extends DBSchema {
  operations: {
    key: string;
    value: PendingOperation;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'offline-sync';
const DB_VERSION = 1;
const STORE_NAME = 'operations';

export function useOfflineSync() {
  const isOnline = ref(true);
  const pendingOps = ref<PendingOperation[]>([]);
  const isSyncing = ref(false);
  
  let db: IDBPDatabase<OfflineSyncDB> | null = null;
  let networkListener: (() => void) | null = null;

  /**
   * Initialize IndexedDB for persistent storage
   */
  async function initDB(): Promise<void> {
    db = await openDB<OfflineSyncDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });

    // Load pending operations from DB
    await loadPendingOperations();
  }

  /**
   * Load pending operations from IndexedDB
   */
  async function loadPendingOperations(): Promise<void> {
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const ops = await store.getAll();
    
    // Sort by timestamp (oldest first)
    pendingOps.value = ops.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Persist pending operations to IndexedDB
   */
  async function persistPendingOps(): Promise<void> {
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear existing and write new
    await store.clear();
    for (const op of pendingOps.value) {
      await store.put(op);
    }

    await tx.done;
  }

  /**
   * Initialize network status listener
   */
  async function initNetworkListener(): Promise<void> {
    const status = await Network.getStatus();
    isOnline.value = status.connected;

    networkListener = (await Network.addListener('networkStatusChange', async (status) => {
      const wasOffline = !isOnline.value;
      isOnline.value = status.connected;

      console.log('Network status changed:', status.connected ? 'online' : 'offline');

      // If we just came back online and have pending ops, sync them
      if (wasOffline && status.connected && pendingOps.value.length > 0) {
        console.log(`Came back online with ${pendingOps.value.length} pending operations`);
        await syncPendingOperations();
      }
    })) as unknown as () => void;
  }

  /**
   * Queue an operation for later execution (or immediate if online)
   */
  async function queueOperation(
    op: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    const operation: PendingOperation = {
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    pendingOps.value.push(operation);
    await persistPendingOps();

    console.log('Operation queued:', operation.type, operation.resource);

    // If online, try to sync immediately
    if (isOnline.value && !isSyncing.value) {
      await syncPendingOperations();
    }
  }

  /**
   * Sync all pending operations to the server
   */
  async function syncPendingOperations(): Promise<void> {
    if (isSyncing.value || pendingOps.value.length === 0) {
      return;
    }

    isSyncing.value = true;
    console.log(`Starting sync of ${pendingOps.value.length} operations...`);

    // Process operations in order (FIFO)
    const opsToProcess = [...pendingOps.value].sort((a, b) => a.timestamp - b.timestamp);

    for (const op of opsToProcess) {
      try {
        await executeOperation(op);
        
        // Remove successful operation
        pendingOps.value = pendingOps.value.filter(o => o.id !== op.id);
        console.log('Operation synced:', op.type, op.resource, op.id);

      } catch (error) {
        console.error('Failed to sync operation:', op.id, error);

        // Increment retry count
        const opIndex = pendingOps.value.findIndex(o => o.id === op.id);
        if (opIndex >= 0) {
          pendingOps.value[opIndex].retryCount++;

          // If exceeded max retries, remove it (or move to DLQ in production)
          if (pendingOps.value[opIndex].retryCount >= 5) {
            console.error('Operation exceeded max retries, removing:', op.id);
            pendingOps.value.splice(opIndex, 1);
          }
        }

        // Stop syncing on first failure to preserve ordering
        break;
      }
    }

    await persistPendingOps();
    isSyncing.value = false;

    console.log(`Sync complete. ${pendingOps.value.length} operations remaining.`);
  }

  /**
   * Execute a single operation against the API
   */
  async function executeOperation(op: PendingOperation): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const url = `${baseUrl}/${op.resource}`;

    let response: Response;

    switch (op.type) {
      case 'create':
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.payload),
        });
        break;

      case 'update':
        // Assume payload has an 'id' field
        const updateId = (op.payload as { id?: string }).id;
        if (!updateId) throw new Error('Update operation missing ID');
        
        response = await fetch(`${url}/${updateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.payload),
        });
        break;

      case 'delete':
        // Assume payload has an 'id' field
        const deleteId = (op.payload as { id?: string }).id;
        if (!deleteId) throw new Error('Delete operation missing ID');
        
        response = await fetch(`${url}/${deleteId}`, {
          method: 'DELETE',
        });
        break;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Manually trigger sync (for pull-to-refresh, etc.)
   */
  async function manualSync(): Promise<void> {
    if (!isOnline.value) {
      throw new Error('Cannot sync while offline');
    }

    await syncPendingOperations();
  }

  /**
   * Clear all pending operations (use with caution!)
   */
  async function clearPendingOperations(): Promise<void> {
    pendingOps.value = [];
    await persistPendingOps();
  }

  // Lifecycle
  onMounted(async () => {
    await initDB();
    await initNetworkListener();
  });

  onUnmounted(() => {
    if (networkListener) {
      Network.removeAllListeners();
    }
  });

  return {
    isOnline,
    pendingOps,
    isSyncing,
    queueOperation,
    syncPendingOperations,
    manualSync,
    clearPendingOperations,
  };
}
