export type Child = {
  id: string;
  name: string;
  age: string;
  color: string;
  mood: string;
};

export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
  blob?: Blob;
  link?: string;
  local: boolean;
};

export type Memory = {
  id: string;
  title: string;
  date: string;
  tag: string;
  childId: string;
  description: string;
  attachments: Attachment[];
};

export type AppState = {
  children: Child[];
  memories: Memory[];
};

const DB_NAME = 'kids-life-canvas';
const DB_VERSION = 1;
const STATE_KEY = 'archive';
const LEGACY_KEY = 'kids-life-canvas-state';

function localDateString(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export const defaultChildren: Child[] = [
  { id: 'baby-demo', name: 'Bebê', age: 'Chegou há pouco', color: '#c77962', mood: 'Nosso novo começo' },
];

export const defaultMemories: Memory[] = [
  {
    id: 'memory-welcome',
    title: 'O começo de tudo',
    date: localDateString(),
    tag: 'Chegada',
    childId: 'baby-demo',
    description: 'Um dia que mudou o tamanho do nosso mundo. Aqui começa a história que vamos guardar juntos.',
    attachments: [],
  },
  {
    id: 'memory-first-hold',
    title: 'Um colo que virou casa',
    date: localDateString(),
    tag: 'Família',
    childId: 'baby-demo',
    description: 'O primeiro encontro, os olhares demorados e a vontade de fazer o tempo ficar quietinho por um instante.',
    attachments: [],
  },
  {
    id: 'memory-little-details',
    title: 'Pequenos detalhes, amor imenso',
    date: localDateString(),
    tag: 'Primeiros dias',
    childId: 'baby-demo',
    description: 'Mãozinhas, bocejos e cada novidade descoberta bem de pertinho. Um capítulo de cada vez.',
    attachments: [],
  },
];

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Este navegador não oferece armazenamento local compatível.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('state')) {
        request.result.createObjectStore('state');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o arquivo local.'));
    request.onblocked = () => reject(new Error('Feche outras abas do Kids Life Canvas e tente novamente.'));
  });
}

function normalizeState(value: Partial<AppState> | null | undefined): AppState {
  const children = Array.isArray(value?.children) ? value.children : defaultChildren;
  const memories = Array.isArray(value?.memories) ? value.memories : defaultMemories;
  return {
    children: children.map((child) => ({
      id: String(child.id),
      name: String(child.name ?? 'Bebê'),
      age: String(child.age ?? ''),
      color: String(child.color ?? '#c77962'),
      mood: String(child.mood ?? 'Nossa história'),
    })),
    memories: memories.map((memory) => ({
      id: String(memory.id),
      title: String(memory.title ?? 'Lembrança'),
      date: String(memory.date ?? localDateString()),
      tag: String(memory.tag ?? 'Família'),
      childId: String(memory.childId ?? children[0]?.id ?? 'baby-demo'),
      description: String(memory.description ?? ''),
      attachments: Array.isArray(memory.attachments) ? memory.attachments : [],
    })),
  };
}

/** IndexedDB is the durable, browser-local archive. Blob bytes are structured-cloned with records. */
export async function loadState(): Promise<AppState> {
  const db = await openDatabase();
  try {
    const stored = await new Promise<Partial<AppState> | undefined>((resolve, reject) => {
      const request = db.transaction('state', 'readonly').objectStore('state').get(STATE_KEY);
      request.onsuccess = () => resolve(request.result as Partial<AppState> | undefined);
      request.onerror = () => reject(request.error ?? new Error('Não foi possível ler o arquivo local.'));
    });
    if (stored) return normalizeState(stored);

    // One-time migration from the previous localStorage prototype; preserve its records and add attachment metadata.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = normalizeState(JSON.parse(legacy) as Partial<AppState>);
      await saveState(migrated);
      localStorage.removeItem(LEGACY_KEY);
      return migrated;
    }
    const fresh = normalizeState({ children: defaultChildren, memories: defaultMemories });
    await saveState(fresh);
    return fresh;
  } finally {
    db.close();
  }
}

export async function saveState(state: AppState): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('state', 'readwrite');
      transaction.objectStore('state').put(state, STATE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Não foi possível salvar no arquivo local.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('O salvamento foi cancelado pelo navegador.'));
    });
  } finally {
    db.close();
  }
}
