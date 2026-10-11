type Memory = {
  title: string;
  date: string;
  tag: string;
  description: string;
};

type ChildProfile = {
  name: string;
  age: string;
  color: string;
  mood: string;
};

const children: ChildProfile[] = [
  { name: 'Alice', age: '4 anos', color: '#9b8cff', mood: 'Curiosa' },
  { name: 'Theo', age: '2 anos', color: '#59c3c3', mood: 'Brincalhão' },
];

const memories: Memory[] = [
  {
    title: 'Primeiro desenho na cozinha',
    date: '12/04/2025',
    tag: 'Casa',
    description: 'Alice desenhou o sol e o cachorro com giz azul e pediu para colarmos na geladeira.',
  },
  {
    title: 'Primeiro passeio ao parque',
    date: '02/06/2025',
    tag: 'Parque',
    description: 'Theo descobriu os balanços e ficou rindo durante todo o trajeto.',
  },
  {
    title: 'Aniversário da família',
    date: '18/07/2025',
    tag: 'Festa',
    description: 'Momentos com bolo, velas e a família completa reunida em volta da mesa.',
  },
  {
    title: 'Primeira palavra',
    date: '05/09/2025',
    tag: 'Marco',
    description: 'Theo disse “mãmã” pela primeira vez ao ver a mãe chegando em casa.',
  },
];

const gallery = [
  'Primeiro desenho',
  'Passeio ao parque',
  'Festa familiar',
  'Visita ao avô',
  'Primeira vacina',
  'Piquenique',
  'Café da manhã',
  'Dormir cedo',
];

const orbitNodes = [
  { x: 50, y: 50, label: 'Alice', color: '#9b8cff' },
  { x: 70, y: 25, label: 'Casa', color: '#f5b7a9' },
  { x: 78, y: 62, label: 'Parque', color: '#7cc9ae' },
  { x: 30, y: 72, label: 'Theo', color: '#59c3c3' },
  { x: 20, y: 38, label: 'Família', color: '#f7d66b' },
];

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-badge">K</div>
          <div>
            <strong>Kids Life Canvas</strong>
            <small>memórias familiares</small>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">Visão geral</button>
          <button className="nav-item">Linha do tempo</button>
          <button className="nav-item">Álbum</button>
          <button className="nav-item">Canvas</button>
          <button className="nav-item">Nuvem</button>
        </nav>

        <div className="panel">
          <div className="section-label">Filhos</div>
          {children.map((child) => (
            <div key={child.name} className="child-card">
              <span className="dot" style={{ background: child.color }} />
              <div>
                <strong>{child.name}</strong>
                <small>{child.age}</small>
              </div>
              <span className="pill">{child.mood}</span>
            </div>
          ))}
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
            <strong>128</strong>
            <small>registrados</small>
          </div>
          <div className="stat-card">
            <span>Fotos</span>
            <strong>843</strong>
            <small>offline no disco</small>
          </div>
          <div className="stat-card">
            <span>Eventos</span>
            <strong>42</strong>
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
              {orbitNodes.map((node) => (
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

          <div className="panel">
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

            <div className="timeline">
              {memories.map((memory) => (
                <div className="timeline-item" key={memory.title}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="meta-row">
                      <strong>{memory.title}</strong>
                      <span>{memory.date}</span>
                    </div>
                    <div className="tag-row">
                      <span className="tag">{memory.tag}</span>
                    </div>
                    <p>{memory.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-row">
              <div className="section-label">Álbum</div>
              <button className="ghost-btn">Apresentar</button>
            </div>

            <div className="gallery-grid">
              {gallery.map((item, index) => (
                <div key={item} className="gallery-item" style={{ background: `hsl(${index * 32} 80% 76%)` }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
