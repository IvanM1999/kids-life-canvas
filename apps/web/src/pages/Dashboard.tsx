import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { Child, Event } from '../services/storage';

const DEFAULT_COLORS = [
  '#9b8cff',
  '#59c3c3',
  '#f5b7a9',
  '#7cc9ae',
  '#f7d66b',
  '#a8c5ff',
  '#ffd966',
  '#c89cff',
  '#ff9db5',
];

function Dashboard() {
  const children = useAppStore((state) => state.children);
  const events = useAppStore((state) => state.events);
  const selectedChildId = useAppStore((state) => state.selectedChildId);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const showNewEventForm = useAppStore((state) => state.showNewEventForm);
  const loadChildren = useAppStore((state) => state.loadChildren);
  const loadEvents = useAppStore((state) => state.loadEvents);
  const loadTags = useAppStore((state) => state.loadTags);
  const addChild = useAppStore((state) => state.addChild);
  const addEvent = useAppStore((state) => state.addEvent);
  const setSelectedChild = useAppStore((state) => state.setSelectedChild);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setShowNewEventForm = useAppStore((state) => state.setShowNewEventForm);

  const [newChild, setNewChild] = useState({ name: '', age: '', color: DEFAULT_COLORS[0] });
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    childId: children[0]?.id ?? 'child-1',
  });

  useEffect(() => {
    loadChildren();
    loadEvents();
    loadTags();
  }, [loadChildren, loadEvents, loadTags]);

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChildId, setSelectedChild]);

  const handleAddChild = () => {
    if (!newChild.name.trim()) return;
    addChild({
      name: newChild.name.trim(),
      age: newChild.age || '0 anos',
      color: newChild.color,
      mood: 'Curioso(a)',
    });
    setNewChild({ name: '', age: '', color: DEFAULT_COLORS[0] });
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim() || !newEvent.description.trim()) return;
    addEvent({
      child_id: newEvent.childId || children[0]?.id || 'child-1',
      title: newEvent.title.trim(),
      description: newEvent.description.trim(),
      event_date: newEvent.date,
      event_type: 'memory',
    });
    setNewEvent({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
      childId: newEvent.childId || children[0]?.id || 'child-1',
    });
    setShowNewEventForm(false);
  };

  const filteredEvents = useMemo(() => {
    const text = searchQuery.trim().toLowerCase();
    return events.filter((event) => {
      const matchesChild = !selectedChildId || event.child_id === selectedChildId;
      const matchesText =
        !text ||
        event.title.toLowerCase().includes(text) ||
        event.description.toLowerCase().includes(text);
      return matchesChild && matchesText;
    });
  }, [events, searchQuery, selectedChildId]);

  const totalPhotos = Math.max(filteredEvents.length * 6 + 18, 1);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-badge">K</div>
          <div>
            <strong>Kids Life Canvas</strong>
            <small>histórico familiar</small>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">Visão geral</button>
          <button className="nav-item">Linha do tempo</button>
          <button className="nav-item">Álbum</button>
          <button className="nav-item">Canvas</button>
          <button className="nav-item">Nuvem</button>
        </nav>

        <div className="panel compact-panel">
          <div className="section-label">Filhos</div>
          <div className="filter-row">
            <button
              className={`filter-pill ${!selectedChildId ? 'selected' : ''}`}
              onClick={() => setSelectedChild(null)}
            >
              Todos
            </button>
          </div>
          {children.map((child) => (
            <button
              key={child.id}
              className={`child-card ${selectedChildId === child.id ? 'selected' : ''}`}
              onClick={() => setSelectedChild(child.id)}
            >
              <span className="dot" style={{ background: child.color }} />
              <div>
                <strong>{child.name}</strong>
                <small>{child.age}</small>
              </div>
              <span className="pill">{child.mood}</span>
            </button>
          ))}
        </div>

        <div className="panel compact-panel form-panel">
          <div className="section-label">Adicionar filho</div>
          <div className="field-stack">
            <input
              value={newChild.name}
              onChange={(e) => setNewChild((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do filho"
            />
            <input
              value={newChild.age}
              onChange={(e) => setNewChild((prev) => ({ ...prev, age: e.target.value }))}
              placeholder="Ex: 4 anos"
            />
            <input
              type="color"
              value={newChild.color}
              onChange={(e) => setNewChild((prev) => ({ ...prev, color: e.target.value }))}
              title="Cor do perfil"
            />
            <button className="primary-btn small" onClick={handleAddChild}>
              Salvar filho
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Histórico de vida</p>
            <h1>Memórias da família</h1>
          </div>
          <button className="primary-btn" onClick={() => setShowNewEventForm(true)}>
            + Nova lembrança
          </button>
        </header>

        <section className="stats-grid">
          <div className="stat-card accent">
            <span>Momentos</span>
            <strong>{filteredEvents.length}</strong>
            <small>registrados</small>
          </div>
          <div className="stat-card">
            <span>Fotos</span>
            <strong>{totalPhotos}</strong>
            <small>offline no disco</small>
          </div>
          <div className="stat-card">
            <span>Eventos</span>
            <strong>{filteredEvents.length}</strong>
            <small>marcos importantes</small>
          </div>
          <div className="stat-card">
            <span>Nuvem</span>
            <strong>OK</strong>
            <small>OneDrive + Google Drive</small>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel large-panel">
            <div className="section-row">
              <div className="section-label">Canvas orbital</div>
              <button className="ghost-btn">Expandir conexão</button>
            </div>

            <div className="orbit-graph">
              <div className="center-node">Família</div>
              {[
                { x: 50, y: 50, label: children[0]?.name ?? 'Alice', color: children[0]?.color ?? '#9b8cff' },
                { x: 70, y: 25, label: 'Casa', color: '#f5b7a9' },
                { x: 78, y: 62, label: 'Parque', color: '#7cc9ae' },
                { x: 30, y: 72, label: children[1]?.name ?? 'Theo', color: children[1]?.color ?? '#59c3c3' },
                { x: 20, y: 38, label: 'Memórias', color: '#f7d66b' },
              ].map((node) => (
                <div
                  key={node.label}
                  className="orbit-node"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    background: node.color,
                  }}
                >
                  {node.label}
                </div>
              ))}
            </div>
          </div>

          <div className="panel compact-panel">
            <div className="section-row">
              <div className="section-label">Nuvem</div>
              <span className="online-tag">online</span>
            </div>
            <ul className="cloud-list">
              <li>
                <span>OneDrive</span>
                <strong>72%</strong>
              </li>
              <li>
                <span>Google Drive</span>
                <strong>46%</strong>
              </li>
              <li>
                <span>Dropbox</span>
                <strong>offline</strong>
              </li>
            </ul>
          </div>
        </section>

        <section className="lower-grid">
          <div className="panel">
            <div className="section-row">
              <div className="section-label">Linha do tempo</div>
              <button className="ghost-btn">Ver tudo</button>
            </div>

            <div className="search-row">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar memória, tag ou frase"
              />
            </div>

            <div className="timeline">
              {filteredEvents.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  Nenhuma memória encontrada
                </p>
              ) : (
                filteredEvents.map((event) => {
                  const child = children.find((c) => c.id === event.child_id);
                  return (
                    <div className="timeline-item" key={event.id}>
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div className="meta-row">
                          <strong>{event.title}</strong>
                          <span>{event.event_date}</span>
                        </div>
                        <div className="tag-row">
                          <span className="tag">{event.event_type || 'Memória'}</span>
                          {child && (
                            <span
                              className="tag child-tag"
                              style={{ background: `${child.color}25`, color: child.color }}
                            >
                              {child.name}
                            </span>
                          )}
                        </div>
                        <p>{event.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="panel">
            <div className="section-row">
              <div className="section-label">Álbum</div>
              <button className="ghost-btn">Apresentar</button>
            </div>

            <div className="gallery-grid">
              {filteredEvents.slice(0, 8).map((event, index) => (
                <div
                  key={event.id}
                  className="gallery-item"
                  style={{
                    background: `linear-gradient(135deg, hsl(${index * 34} 80% 89%), hsl(${index * 28 + 20} 70% 82%))`,
                  }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        </section>

        {showNewEventForm && (
          <section className="composer-grid modal-overlay">
            <div className="panel form-panel modal-content">
              <div className="section-label">Nova memória</div>
              <div className="field-stack">
                <input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título da memória"
                />
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
                />
                <select
                  value={newEvent.childId}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, childId: e.target.value }))}
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o momento, o contexto e o que ficou marcado..."
                  rows={4}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="primary-btn small" onClick={handleAddEvent}>
                    Salvar memória
                  </button>
                  <button
                    className="ghost-btn small"
                    onClick={() => setShowNewEventForm(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
