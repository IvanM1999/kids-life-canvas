export type Child = {
  id: string;
  name: string;
  age: string;
  color: string;
  mood: string;
};

export type Memory = {
  id: string;
  title: string;
  date: string;
  tag: string;
  childId: string;
  description: string;
};

export type AppState = {
  children: Child[];
  memories: Memory[];
};

export const defaultChildren: Child[] = [
  { id: 'child-1', name: 'Alice', age: '4 anos', color: '#9b8cff', mood: 'Curiosa' },
  { id: 'child-2', name: 'Theo', age: '2 anos', color: '#59c3c3', mood: 'Brincalhão' },
];

export const defaultMemories: Memory[] = [
  {
    id: 'memory-1',
    title: 'Primeiro desenho na cozinha',
    date: '2025-04-12',
    tag: 'Casa',
    childId: 'child-1',
    description: 'Alice desenhou o sol e o cachorro com giz azul e pediu para colarmos na geladeira.',
  },
  {
    id: 'memory-2',
    title: 'Primeiro passeio ao parque',
    date: '2025-06-02',
    tag: 'Parque',
    childId: 'child-2',
    description: 'Theo descobriu os balanços e ficou rindo durante todo o trajeto.',
  },
  {
    id: 'memory-3',
    title: 'Aniversário da família',
    date: '2025-07-18',
    tag: 'Festa',
    childId: 'child-1',
    description: 'Momentos com bolo, velas e a família completa reunida em volta da mesa.',
  },
  {
    id: 'memory-4',
    title: 'Primeira palavra',
    date: '2025-09-05',
    tag: 'Marco',
    childId: 'child-2',
    description: 'Theo disse “mãmã” pela primeira vez ao ver a mãe chegando em casa.',
  },
];

const STORAGE_KEY = 'kids-life-canvas-state';

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {
      children: defaultChildren,
      memories: defaultMemories,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      children: Array.isArray(parsed.children) && parsed.children.length ? parsed.children : defaultChildren,
      memories: Array.isArray(parsed.memories) && parsed.memories.length ? parsed.memories : defaultMemories,
    };
  } catch {
    return {
      children: defaultChildren,
      memories: defaultMemories,
    };
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
