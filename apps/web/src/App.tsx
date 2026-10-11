import { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { useAppStore } from './store/appStore';

function App() {
  const loadChildren = useAppStore((state) => state.loadChildren);
  const loadEvents = useAppStore((state) => state.loadEvents);
  const loadTags = useAppStore((state) => state.loadTags);

  useEffect(() => {
    console.log('🎨 Kids Life Canvas inicializado');
    loadChildren();
    loadEvents();
    loadTags();
  }, [loadChildren, loadEvents, loadTags]);

  return <Dashboard />;
}

export default App;
