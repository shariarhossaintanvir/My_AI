// ==========================================
// MY AI — IndexedDB Client-Side Storage
// ==========================================

import { Conversation, Message, UserSettings, UsageLog } from '@/types';

const DB_NAME = 'my_ai_db';
const DB_VERSION = 1;

const STORES = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  SETTINGS: 'settings',
  USAGE_LOGS: 'usage_logs',
} as const;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'dark',
  preferredModel: 'claude-3-5-sonnet-20241022',
  systemInstructions: '',
  temperature: 0.7,
  maxOutputTokens: 4096,
  sendOnEnter: true,
};

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only accessible in browser environments'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
        const convStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id' });
        convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const msgStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        msgStore.createIndex('conversationId', 'conversationId', { unique: false });
        msgStore.createIndex('sequenceNumber', 'sequenceNumber', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.USAGE_LOGS)) {
        const usageStore = db.createObjectStore(STORES.USAGE_LOGS, { keyPath: 'id' });
        usageStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// ----------------- Conversations -----------------

export async function idbGetConversations(): Promise<Conversation[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CONVERSATIONS, 'readonly');
    const store = transaction.objectStore(STORES.CONVERSATIONS);
    const request = store.getAll();

    request.onsuccess = () => {
      const list: Conversation[] = request.result || [];
      // Sort newest first
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function idbSaveConversation(conv: Conversation): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CONVERSATIONS, 'readwrite');
    const store = transaction.objectStore(STORES.CONVERSATIONS);
    const request = store.put(conv);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbDeleteConversation(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONVERSATIONS, STORES.MESSAGES], 'readwrite');
    const convStore = transaction.objectStore(STORES.CONVERSATIONS);
    const msgStore = transaction.objectStore(STORES.MESSAGES);

    convStore.delete(id);

    // Delete associated messages
    const index = msgStore.index('conversationId');
    const keyRange = IDBKeyRange.only(id);
    const request = index.openKeyCursor(keyRange);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        msgStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ----------------- Messages -----------------

export async function idbGetMessages(conversationId: string): Promise<Message[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MESSAGES, 'readonly');
    const store = transaction.objectStore(STORES.MESSAGES);
    const index = store.index('conversationId');
    const request = index.getAll(IDBKeyRange.only(conversationId));

    request.onsuccess = () => {
      const list: Message[] = request.result || [];
      list.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function idbSaveMessage(msg: Message): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MESSAGES, 'readwrite');
    const store = transaction.objectStore(STORES.MESSAGES);
    const request = store.put(msg);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbTruncateMessagesAfter(conversationId: string, sequenceNumber: number): Promise<void> {
  const messages = await idbGetMessages(conversationId);
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MESSAGES, 'readwrite');
    const store = transaction.objectStore(STORES.MESSAGES);

    for (const msg of messages) {
      if (msg.sequenceNumber > sequenceNumber) {
        store.delete(msg.id);
      }
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ----------------- Settings -----------------

export async function idbGetSettings(): Promise<UserSettings> {
  const db = await getDb();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.get('user_settings');

    request.onsuccess = () => {
      if (request.result && request.result.value) {
        resolve({ ...DEFAULT_USER_SETTINGS, ...request.result.value });
      } else {
        resolve(DEFAULT_USER_SETTINGS);
      }
    };
    request.onerror = () => resolve(DEFAULT_USER_SETTINGS);
  });
}

export async function idbSaveSettings(settings: UserSettings): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.put({ key: 'user_settings', value: settings });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ----------------- Usage Logs -----------------

export async function idbGetUsageLogs(): Promise<UsageLog[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.USAGE_LOGS, 'readonly');
    const store = transaction.objectStore(STORES.USAGE_LOGS);
    const request = store.getAll();

    request.onsuccess = () => {
      const list: UsageLog[] = request.result || [];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function idbAddUsageLog(log: UsageLog): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.USAGE_LOGS, 'readwrite');
    const store = transaction.objectStore(STORES.USAGE_LOGS);
    const request = store.put(log);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
