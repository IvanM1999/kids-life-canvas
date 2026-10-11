// Local storage implementation for browser environment

export type Child = {
  id: string;
  name: string;
  age: string;
  color: string;
  mood: string;
  created_at: string;
  updated_at: string;
};

export type Event = {
  id: string;
  child_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_type?: string;
  created_at: string;
  updated_at: string;
};

export type Album = {
  id: string;
  title: string;
  description?: string;
  album_type: 'yearly' | 'milestone' | 'theme' | 'manual';
  child_id?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
  color?: string;
  created_at: string;
};

const STORAGE_KEY = 'kids-life-canvas';

interface StorageData {
  children: Child[];
  events: Event[];
  albums: Album[];
  tags: Tag[];
}

const defaultData: StorageData = {
  children: [
    {
      id: 'child-1',
      name: 'Alice',
      age: '4 anos',
      color: '#9b8cff',
      mood: 'Curiosa',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'child-2',
      name: 'Theo',
      age: '2 anos',
      color: '#59c3c3',
      mood: 'Brincalhão',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  events: [
    {
      id: 'event-1',
      child_id: 'child-1',
      title: 'Primeiro desenho na cozinha',
      description: 'Alice desenhou o sol e o cachorro com giz azul e pediu para colarmos na geladeira.',
      event_date: '2025-04-12',
      event_type: 'milestone',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'event-2',
      child_id: 'child-2',
      title: 'Primeiro passeio ao parque',
      description: 'Theo descobriu os balanços e ficou rindo durante todo o trajeto.',
      event_date: '2025-06-02',
      event_type: 'outing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'event-3',
      child_id: 'child-1',
      title: 'Aniversário da família',
      description: 'Momentos com bolo, velas e a família completa reunida em volta da mesa.',
      event_date: '2025-07-18',
      event_type: 'celebration',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'event-4',
      child_id: 'child-2',
      title: 'Primeira palavra',
      description: 'Theo disse "mãmã" pela primeira vez ao ver a mãe chegando em casa.',
      event_date: '2025-09-05',
      event_type: 'milestone',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  albums: [
    {
      id: 'album-1',
      title: 'Ano de 2025',
      description: 'Memórias do ano inteiro',
      album_type: 'yearly',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'album-2',
      title: 'Marcos importantes',
      description: 'Momentos que marcaram a infância',
      album_type: 'theme',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  tags: [
    { id: 'tag-1', name: 'Casa', color: '#f5b7a9', created_at: new Date().toISOString() },
    { id: 'tag-2', name: 'Parque', color: '#7cc9ae', created_at: new Date().toISOString() },
    { id: 'tag-3', name: 'Escola', color: '#a8c5ff', created_at: new Date().toISOString() },
    { id: 'tag-4', name: 'Viagem', color: '#ffd966', created_at: new Date().toISOString() },
    { id: 'tag-5', name: 'Marco', color: '#c89cff', created_at: new Date().toISOString() },
    { id: 'tag-6', name: 'Festa', color: '#ff9db5', created_at: new Date().toISOString() },
  ],
};

function initializeStorage() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  }
}

function getData(): StorageData {
  initializeStorage();
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : defaultData;
}

function saveData(data: StorageData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Children operations
export function getChildren(): Child[] {
  const data = getData();
  return data.children;
}

export function addChild(child: Omit<Child, 'id' | 'created_at' | 'updated_at'>): Child {
  const data = getData();
  const now = new Date().toISOString();
  const newChild: Child = {
    ...child,
    id: `child-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };
  data.children.push(newChild);
  saveData(data);
  return newChild;
}

export function removeChild(id: string) {
  const data = getData();
  data.children = data.children.filter(c => c.id !== id);
  data.events = data.events.filter(e => e.child_id !== id);
  saveData(data);
}

// Events operations
export function getEvents(): Event[] {
  const data = getData();
  return data.events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
}

export function getEventsByChild(childId: string): Event[] {
  const data = getData();
  return data.events
    .filter(e => e.child_id === childId)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
}

export function addEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Event {
  const data = getData();
  const now = new Date().toISOString();
  const newEvent: Event = {
    ...event,
    id: `event-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };
  data.events.push(newEvent);
  saveData(data);
  return newEvent;
}

export function removeEvent(id: string) {
  const data = getData();
  data.events = data.events.filter(e => e.id !== id);
  saveData(data);
}

// Albums operations
export function getAlbums(): Album[] {
  const data = getData();
  return data.albums;
}

export function addAlbum(album: Omit<Album, 'id' | 'created_at' | 'updated_at'>): Album {
  const data = getData();
  const now = new Date().toISOString();
  const newAlbum: Album = {
    ...album,
    id: `album-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };
  data.albums.push(newAlbum);
  saveData(data);
  return newAlbum;
}

export function removeAlbum(id: string) {
  const data = getData();
  data.albums = data.albums.filter(a => a.id !== id);
  saveData(data);
}

// Tags operations
export function getTags(): Tag[] {
  const data = getData();
  return data.tags;
}

export function addTag(tag: Omit<Tag, 'id' | 'created_at'>): Tag {
  const data = getData();
  const newTag: Tag = {
    ...tag,
    id: `tag-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  data.tags.push(newTag);
  saveData(data);
  return newTag;
}
