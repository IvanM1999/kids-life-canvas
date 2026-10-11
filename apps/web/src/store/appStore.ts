import { create } from 'zustand';
import type { Child, Event, Album, Tag } from '../services/storage';
import * as storage from '../services/storage';

interface AppStoreState {
  children: Child[];
  events: Event[];
  albums: Album[];
  tags: Tag[];
  selectedChildId: string | null;
  searchQuery: string;
  showNewEventForm: boolean;

  // Children actions
  loadChildren: () => void;
  addChild: (child: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => void;
  removeChild: (id: string) => void;
  setSelectedChild: (id: string | null) => void;

  // Events actions
  loadEvents: () => void;
  addEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => void;
  removeEvent: (id: string) => void;

  // Albums actions
  loadAlbums: () => void;
  addAlbum: (album: Omit<Album, 'id' | 'created_at' | 'updated_at'>) => void;
  removeAlbum: (id: string) => void;

  // Tags
  loadTags: () => void;

  // Filter
  setSearchQuery: (query: string) => void;
  setShowNewEventForm: (show: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  children: [],
  events: [],
  albums: [],
  tags: [],
  selectedChildId: null,
  searchQuery: '',
  showNewEventForm: false,

  loadChildren: () => {
    const children = storage.getChildren();
    set({ children, selectedChildId: children.length > 0 ? children[0].id : null });
  },

  addChild: (child) => {
    const newChild = storage.addChild(child);
    set((state) => ({ children: [newChild, ...state.children], selectedChildId: newChild.id }));
  },

  removeChild: (id) => {
    storage.removeChild(id);
    set((state) => ({ children: state.children.filter((c) => c.id !== id) }));
  },

  setSelectedChild: (id) => set({ selectedChildId: id }),

  loadEvents: () => {
    const events = storage.getEvents();
    set({ events });
  },

  addEvent: (event) => {
    const newEvent = storage.addEvent(event);
    set((state) => ({ events: [newEvent, ...state.events] }));
  },

  removeEvent: (id) => {
    storage.removeEvent(id);
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
  },

  loadAlbums: () => {
    const albums = storage.getAlbums();
    set({ albums });
  },

  addAlbum: (album) => {
    const newAlbum = storage.addAlbum(album);
    set((state) => ({ albums: [newAlbum, ...state.albums] }));
  },

  removeAlbum: (id) => {
    storage.removeAlbum(id);
    set((state) => ({ albums: state.albums.filter((a) => a.id !== id) }));
  },

  loadTags: () => {
    const tags = storage.getTags();
    set({ tags });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowNewEventForm: (show) => set({ showNewEventForm: show }),
}));
