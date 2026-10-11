import { useEffect, useMemo, useState } from 'react';
import {
  defaultChildren,
  defaultMemories,
  loadState,
  saveState,
  type Child,
  type Memory,
} from './storage';

const initialCloudStatus = [
  { provider: 'OneDrive', status: 'Conectado', progress: 72 },
  { provider: 'Google Drive', status: 'Sincronizando', progress: 46 },
  { provider: 'Dropbox', status: 'Off-line', progress: 0 },
];

const defaultFilter = 'Todos';

function App() {
  const [children, setChildren] = useState<Child[]>(() => loadState().children);
  const [memories, setMemories] = useState<Memory[]>(() => loadState().memories);
  const [selectedChild, setSelectedChild] = useState<string>(defaultFilter);
  const [query, setQuery] = useState('');
  const [newChild, setNewChild] = useState({ name: '', age: '', color: '#8b5cf6' });
  const [newMemory, setNewMemory] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    tag: 'Casa',
    childId: defaultChildren[0]?.id ?? 'child-1',
    description: '',
  });

  useEffect(() => {
    saveState({ children, memories });
  }, [children, memories]);

  const filteredMemories = useMemo(() => {
    const text = query.trim().toLowerCase();

    return memories.filter((memory) => {
      const matchesChild = selectedChild === defaultFilter || memory.childId === selectedChild;
      const matchesText =
        !text ||
        memory.title.toLowerCase().includes(text) ||
        memory.description.toLowerCase().includes(text) ||
        memory.tag.toLowerCase().includes(text);

      return matchesChild && matchesText;
    });
  }, [memories, query, selectedChild]);

  const addChild = () => {
    if (!newChild.name.trim()) return;

    const child: Child = {
      id: `child-${Date.now()}`,
      name: newChild.name.trim(),
      age: newChild.age || '0 anos',
      color: newChild.color,
      mood: 'Curioso(a)',
    };

    setChildren((prev) => [child, ...prev]);
    setSelectedChild(child.id);
    setNewChild({ name: '', age: '', color: '#8b5cf6' });
  };

  const addMemory = () => {
    if (!newMemory.title.trim() || !newMemory.description.trim()) return;

    const memory: Memory = {
      id: `memory-${Date.now()}`,
      title: newMemory.title.trim(),
      date: newMemory.date,
      tag: newMemory.tag,
      childId: newMemory.childId,
      description: newMemory.description.trim(),
    };

    setMemories((prev) => [memory, ...prev]);
    setNewMemory({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      tag: 'Casa',
      childId: newMemory.childId,
      description: '',
    });
  };

  const totalPhotos = memories.length * 6 + 18;
  const totalEvents = memories.length;

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
              className={`filter-pill ${selectedChild === defaultFilter ? 'selected' : ''}`}
              onClick={() => setSelectedChild(defaultFilter)}
            >
              Todos
            </button>
          </div>

          {children.map((child) => (
            <button
              key={child.id}
              className={`child-card ${selectedChild === child.id ? 'selected' : ''}`}
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
            <button className="primary-btn small" onClick={addChild}>Salvar filho</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Histórico de vida</p>
            <h1>Memórias da família</h1>
          </div>
          <button className="primary-btn">+ Nova lembrança</button>
        </header>

        <section className="stats-grid">
          <div className="stat-card accent">
            <span>Momentos</span>
            <strong>{memories.length}</strong>
            <small>registrados</small>
          </div>
          <div className="stat-card">
            <span>Fotos</span>
            <strong>{totalPhotos}</strong>
            <small>offline no disco</small>
          </div>
          <div className="stat-card">
            <span>Eventos</span>
            <strong>{totalEvents}</strong>
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
                { x: 20, y: 38, label: 'Família', color: '#f7d66b' },
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
              {initialCloudStatus.map((item) => (
                <li key={item.provider}>
                  <span>{item.provider}</span>
                  <strong>{item.status === 'Off-line' ? 'offline' : `${item.progress}%`}</strong>
                </li>
              ))}
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar memória, tag ou frase"
              />
            </div>

            <div className="timeline">
              {filteredMemories.map((memory) => {
                const child = children.find((item) => item.id === memory.childId);
                return (
                  <div className="timeline-item" key={memory.id}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="meta-row">
                        <strong>{memory.title}</strong>
                        <span>{memory.date}</span>
                      </div>
                      <div className="tag-row">
                        <span className="tag">{memory.tag}</span>
                        {child && <span className="tag child-tag" style={{ background: `${child.color}25`, color: child.color }}>{child.name}</span>}
                      </div>
                      <p>{memory.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="section-row">
              <div className="section-label">Álbum</div>
              <button className="ghost-btn">Apresentar</button>
            </div>

            <div className="gallery-grid">
              {filteredMemories.slice(0, 8).map((memory, index) => (
                <div
                  key={memory.id}
                  className="gallery-item"
                  style={{ background: `linear-gradient(135deg, hsl(${index * 34} 80% 89%), hsl(${index * 28 + 20} 70% 82%))` }}
                >
                  {memory.title}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="composer-grid">
          <div className="panel form-panel">
            <div className="section-label">Nova memória</div>
            <div className="field-stack">
              <input
                value={newMemory.title}
                onChange={(e) => setNewMemory((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Título da memória"
              />
              <input
                type="date"
                value={newMemory.date}
                onChange={(e) => setNewMemory((prev) => ({ ...prev, date: e.target.value }))}
              />
              <select
                value={newMemory.childId}
                onChange={(e) => setNewMemory((prev) => ({ ...prev, childId: e.target.value }))}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
              <input
                value={newMemory.tag}
                onChange={(e) => setNewMemory((prev) => ({ ...prev, tag: e.target.value }))}
                placeholder="Tag (ex: Casa, Escola, Viagem)"
              />
              <textarea
                value={newMemory.description}
                onChange={(e) => setNewMemory((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o momento, o contexto e o que ficou marcado..."
                rows={4}
              />
              <button className="primary-btn small" onClick={addMemory}>Salvar memória</button>
            </div>
          </div>

          <div className="panel form-panel">
            <div className="section-label">Arquivos locais + nuvem</div>
            <div className="upload-card">
              <div className="upload-box">
                <span>📁</span>
                <strong>Importar pasta local</strong>
                <small>arquivos offline prontos para indexar</small>
              </div>
              <div className="upload-box">
                <span>☁️</span>
                <strong>Conectar OneDrive</strong>
                <small>buscar fotos e documentos na nuvem</small>
              </div>
              <div className="upload-box">
                <span>🟨</span>
                <strong>Google Drive</strong>
                <small>sincronização opcional</small>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
