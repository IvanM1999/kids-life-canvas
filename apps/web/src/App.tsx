import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppState, Attachment, Child, loadState, Memory, saveState } from './storage';

type View = 'inicio' | 'timeline' | 'album' | 'canvas' | 'arquivo';
type Draft = Omit<Memory, 'id'> & { id?: string };
const today = () => { const date = new Date(); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 10); };
const blankDraft = (childId: string): Draft => ({
  title: '', date: today(), tag: 'Primeiros dias', childId, description: '', attachments: [],
});
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const fmtDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
const fileLimit = 20 * 1024 * 1024;

function App() {
  const [archive, setArchive] = useState<AppState>({ children: [], memories: [] });
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>('inicio');
  const [childFilter, setChildFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('Todas as histórias');
  const [dateFilter, setDateFilter] = useState('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [newChildName, setNewChildName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [cloudNotice, setCloudNotice] = useState('');
  const [importProgress, setImportProgress] = useState('');
  const [selectedOrbit, setSelectedOrbit] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadState().then((state) => {
      if (active) { setArchive(state); setReady(true); }
    }).catch((reason: unknown) => {
      if (active) { setError(reason instanceof Error ? reason.message : 'Não foi possível abrir o arquivo local.'); setReady(true); }
    });
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { active = false; window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const child = archive.children.find((item) => item.id === childFilter);
  const tags = useMemo(() => ['Todas as histórias', ...Array.from(new Set(archive.memories.map((memory) => memory.tag))).sort()], [archive.memories]);
  const memories = useMemo(() => archive.memories
    .filter((memory) => childFilter === 'all' || memory.childId === childFilter)
    .filter((memory) => tagFilter === 'Todas as histórias' || memory.tag === tagFilter)
    .filter((memory) => !dateFilter || memory.date === dateFilter)
    .filter((memory) => {
      const term = query.trim().toLocaleLowerCase('pt-BR');
      if (!term) return true;
      return [memory.title, memory.description, memory.tag].some((value) => value.toLocaleLowerCase('pt-BR').includes(term));
    })
    .sort((a, b) => b.date.localeCompare(a.date)), [archive.memories, childFilter, tagFilter, dateFilter, query]);
  const mediaCount = archive.memories.reduce((total, memory) => total + memory.attachments.filter((item) => item.local).length, 0);
  const totalBytes = archive.memories.flatMap((item) => item.attachments).reduce((sum, item) => sum + (item.blob?.size ?? 0), 0);

  async function persist(next: AppState, message = 'Guardado neste dispositivo.'): Promise<boolean> {
    if (saving) return false;
    setSaving(true);
    setError('');
    try {
      await saveState(next);
      setArchive(next);
      setToast(message);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao salvar. Exporte uma cópia e verifique o espaço disponível.');
      return false;
    } finally { setSaving(false); }
  }

  function openNewMemory() {
    const target = childFilter === 'all' ? archive.children[0]?.id : childFilter;
    if (!target) { setError('Adicione um perfil antes de registrar uma lembrança.'); return; }
    setDraft(blankDraft(target));
  }

  function openEdit(memory: Memory) { setDraft({ ...memory, attachments: [...memory.attachments] }); }

  async function saveMemory(event: FormEvent) {
    event.preventDefault();
    if (!draft || !draft.title.trim()) return;
    const record: Memory = { ...draft, id: draft.id ?? id(), title: draft.title.trim(), tag: draft.tag.trim() || 'Lembrança', description: draft.description.trim() } as Memory;
    const next = { ...archive, memories: draft.id
      ? archive.memories.map((item) => item.id === draft.id ? record : item)
      : [record, ...archive.memories] };
    if (!await persist(next, draft.id ? 'Lembrança atualizada.' : 'Sua lembrança já faz parte do arquivo.')) return;
    setDraft(null); setShowLink(false); setLinkUrl('');
  }

  async function removeMemory(memory: Memory) {
    if (!window.confirm(`Excluir “${memory.title}” e seus vínculos locais?`)) return;
    await persist({ ...archive, memories: archive.memories.filter((item) => item.id !== memory.id) }, 'Lembrança removida.');
  }

  async function addChild(event: FormEvent) {
    event.preventDefault();
    if (!newChildName.trim()) return;
    const newChild: Child = { id: id(), name: newChildName.trim(), age: 'Novo capítulo', color: '#71917c', mood: 'Nossa alegria' };
    if (!await persist({ ...archive, children: [...archive.children, newChild] }, 'Perfil criado.')) return;
    setNewChildName(''); setChildFilter(newChild.id);
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!draft || !files.length) return;
    const additions: Attachment[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      setImportProgress(`Lendo arquivo ${i + 1} de ${files.length}…`);
      if (file.size > fileLimit) { setError(`${file.name} excede o limite de 20 MB por arquivo.`); continue; }
      if (!(file.type.startsWith('image/') && file.type !== 'image/svg+xml' || file.type.startsWith('video/') || file.type === 'application/pdf' || file.type.startsWith('audio/'))) {
        setError(`${file.name}: tipo não compatível. Escolha imagem, vídeo, áudio ou PDF.`); continue;
      }
      additions.push({ id: id(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, addedAt: new Date().toISOString(), blob: file, local: true });
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    if (additions.length) setDraft((current) => current ? { ...current, attachments: [...current.attachments, ...additions] } : current);
    setImportProgress('');
    if (additions.length) setToast(`${additions.length} arquivo(s) prontos para guardar com a lembrança.`);
  }

  function addLink() {
    if (!draft) return;
    try {
      const url = new URL(linkUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use um link HTTP ou HTTPS.');
      const attachment: Attachment = { id: id(), name: url.hostname, type: 'link', size: 0, addedAt: new Date().toISOString(), link: url.toString(), local: false };
      setDraft({ ...draft, attachments: [...draft.attachments, attachment] });
      setLinkUrl(''); setShowLink(false);
      setToast('Link adicionado. Ele precisa de internet e não é uma cópia local.');
    } catch { setError('Esse link não parece válido. Cole um endereço começando por https://'); }
  }

  async function exportArchive() {
    try {
      const memories = await Promise.all(archive.memories.map(async (memory) => ({
        ...memory,
        attachments: await Promise.all(memory.attachments.map(async (item) => ({
          ...item, blob: undefined,
          data: item.blob ? await blobToData(item.blob) : undefined,
        }))),
      })));
      const file = new Blob([JSON.stringify({ format: 'kids-life-canvas', version: 1, exportedAt: new Date().toISOString(), children: archive.children, memories }, null, 2)], { type: 'application/json' });
      if (file.size > 100 * 1024 * 1024) { setError('Esta cópia excederia o limite de 100 MB desta versão. Remova alguns anexos antes de exportar.'); return; }
      download(file, `kids-life-canvas-${today()}.json`);
      setToast('Cópia de segurança exportada para seus downloads.');
    } catch { setError('Não foi possível preparar a cópia de segurança. Tente novamente ou exporte menos arquivos.'); }
  }

  async function importArchive(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError('A cópia excede o limite de importação de 100 MB.'); return; }
    try {
      const parsed = JSON.parse(await file.text()) as { format?: string; children?: Child[]; memories?: Array<Omit<Memory, 'attachments'> & { attachments: Array<Attachment & { data?: string }> }> };
      if (parsed.format !== 'kids-life-canvas' || !Array.isArray(parsed.children) || !Array.isArray(parsed.memories)) throw new Error('Arquivo incompatível.');
      const childIds = new Set<string>();
      for (const person of parsed.children) {
        if (typeof person.id !== 'string' || !person.id || typeof person.name !== 'string' || !person.name.trim() || person.name.length > 100 || childIds.has(person.id)) throw new Error('Os perfis da cópia não são válidos.');
        childIds.add(person.id);
      }
      const validMime = (type: string) => (type.startsWith('image/') && type !== 'image/svg+xml') || type.startsWith('video/') || type.startsWith('audio/') || type === 'application/pdf';
      for (const memory of parsed.memories) {
        if (typeof memory.id !== 'string' || typeof memory.title !== 'string' || !memory.title.trim() || memory.title.length > 100 || typeof memory.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(memory.date) || Number.isNaN(new Date(`${memory.date}T12:00:00`).getTime()) || !childIds.has(memory.childId) || !Array.isArray(memory.attachments)) throw new Error('Uma lembrança da cópia não é válida.');
        for (const attachment of memory.attachments) {
          if (typeof attachment.name !== 'string' || typeof attachment.local !== 'boolean') throw new Error('Um anexo da cópia não é válido.');
          if (attachment.local) {
            if (!attachment.data || !validMime(attachment.type) || attachment.data.length > fileLimit * 1.4 || attachment.size > fileLimit) throw new Error('Uma mídia local da cópia excede o limite ou não é compatível.');
          } else {
            let link: URL;
            try { if (typeof attachment.link !== 'string') throw new Error(); link = new URL(attachment.link); } catch { throw new Error('Um link da cópia não é válido.'); }
            if (!['http:', 'https:'].includes(link.protocol)) throw new Error('Um link da cópia não é seguro.');
          }
        }
      }
      const restored: AppState = {
        children: parsed.children,
        memories: parsed.memories.map((memory) => ({
          ...memory,
          attachments: (memory.attachments ?? []).map(({ data, ...attachment }) => ({ ...attachment, blob: data ? dataToBlob(data, attachment.type) : undefined })),
        })),
      };
      if (!window.confirm('Importar esta cópia substituirá o arquivo aberto neste dispositivo. Deseja continuar?')) return;
      await persist(restored, 'Arquivo restaurado com sucesso.');
    } catch (reason) {
      setError(reason instanceof Error && reason.message !== 'Arquivo incompatível.' ? `Não foi possível importar: ${reason.message}` : 'Cópia inválida ou incompatível. Seus dados atuais foram preservados.');
    }
  }

  async function connectProvider(provider: string) {
    setCloudNotice(`${provider}: conexão ainda não configurada. Nenhuma conta foi conectada ou dado enviado. O arquivo local continua disponível.`);
  }

  if (!ready) return <div className="loading-screen"><span className="sun-mark">✳</span><p>Abrindo seu arquivo de memórias…</p></div>;

  const nav: Array<{ id: View; label: string; icon: string }> = [
    { id: 'inicio', label: 'Nossa história', icon: '⌂' },
    { id: 'timeline', label: 'Linha do tempo', icon: '↟' },
    { id: 'album', label: 'Álbum de família', icon: '▧' },
    { id: 'canvas', label: 'Mapa de memórias', icon: '✳' },
    { id: 'arquivo', label: 'Arquivo & cópias', icon: '◇' },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); setView('inicio'); }} aria-label="Kids Life Canvas — início">
          <span className="brand-icon">✳</span><span><strong>kids life</strong><small>canvas de memórias</small></span>
        </a>
        <div className="side-caption">O NOSSO CANTINHO</div>
        <nav className="nav" aria-label="Navegação principal">
          {nav.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)} aria-label={item.label} title={item.label} aria-current={view === item.id ? 'page' : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
        </nav>
        <div className="side-divider" />
        <div className="side-heading"><span>Quem faz parte</span><span>{archive.children.length}</span></div>
        <button className={`person-row ${childFilter === 'all' ? 'person-selected' : ''}`} onClick={() => setChildFilter('all')}><span className="avatar all-avatar">♡</span><span><strong>Todo mundo</strong><small>{archive.memories.length} momentos</small></span></button>
        {archive.children.map((item) => <button key={item.id} className={`person-row ${childFilter === item.id ? 'person-selected' : ''}`} onClick={() => setChildFilter(item.id)}><span className="avatar" style={{ background: `${item.color}24`, color: item.color }}>{item.name.slice(0, 1).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.age}</small></span><i style={{ background: item.color }} /></button>)}
        <form className="add-person" onSubmit={addChild}><label htmlFor="new-child">Adicionar perfil</label><div><input id="new-child" value={newChildName} onChange={(event) => setNewChildName(event.target.value)} placeholder="Nome ou apelido" maxLength={40} /><button aria-label="Adicionar perfil" type="submit">+</button></div></form>
        <div className="sidebar-bottom"><div className="privacy-seal"><span>⌑</span><div><strong>Seu espaço, só seu</strong><small>Guardado neste dispositivo</small></div></div><div className="sync-line"><span className={`status-dot ${online ? '' : 'offline'}`} />{online ? 'Pronto para usar offline' : 'Sem internet · tudo bem'}</div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-icon">✳</span><strong>kids life</strong></div>
          <div className="crumb">NOSSA FAMÍLIA <span>/</span> {nav.find((item) => item.id === view)?.label.toUpperCase()}</div>
          <div className="top-actions"><span className="save-indicator"><i className={saving ? 'saving' : ''} />{saving ? 'Salvando…' : 'Salvo localmente'}</span><button className="avatar-mini" aria-label="Perfil e privacidade">♡</button></div>
        </header>

        {view === 'inicio' && <section className="welcome-hero">
          <div className="hero-copy"><div className="eyebrow"><span>✦</span> UM LUGAR PARA CRESCER JUNTOS</div><h1>As pequenas coisas<br />viram <em>tudo.</em></h1><p>Um cantinho só de vocês para guardar os dias que passam depressa — e revisitá-los sempre que o coração pedir.</p><div className="hero-actions"><button className="button-primary" onClick={openNewMemory}>＋ Guardar uma lembrança</button><button className="text-action" onClick={() => setView('canvas')}>Explorar nosso mapa <span>↗</span></button></div><div className="hero-byline"><div className="tiny-faces">{archive.children.slice(0, 3).map((person) => <span key={person.id} style={{ background: person.color }}>{person.name.slice(0, 1)}</span>)}</div><span>Uma história feita de muitos começos</span></div></div>
          <div className="hero-art" aria-label="Ilustração de sol e flores"><div className="art-sun">☼</div><div className="art-hill hill-back" /><div className="art-hill hill-front" /><span className="art-flower flower-one">✿</span><span className="art-flower flower-two">✿</span><span className="art-star">✳</span><div className="art-note">aqui mora<br />o nosso amor <span>♡</span></div></div>
        </section>}

        {view === 'inicio' && <section className="profile-strip"><div className="profile-intro"><span className="little-flower">✿</span><div><strong>Um novo capítulo começa</strong><small>Exemplos carinhosos para personalizar com a história de vocês.</small></div></div><div className="profile-facts"><span><b>{archive.memories.length}</b> lembranças</span><span className="fact-divider" /><span><b>{mediaCount}</b> arquivos guardados</span><span className="fact-divider" /><span>feito com <b className="heart">♥</b> por vocês</span></div></section>}

        <div className="section-heading">
          <div><div className="eyebrow">{view === 'inicio' ? 'UM PEDACINHO DE CADA DIA' : 'O NOSSO ARQUIVO'}</div><h2>{view === 'inicio' ? 'Memórias para guardar' : nav.find((item) => item.id === view)?.label}</h2></div>
          <div className="heading-actions">{view !== 'canvas' && <label className="filter-select"><span className="sr-only">Filtrar por tema</span><select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>{tags.map((tag) => <option key={tag}>{tag}</option>)}</select><span aria-hidden="true">⌄</span></label>}<button className="button-outline" onClick={openNewMemory}>＋ <span>Nova lembrança</span></button></div>
        </div>

        {view !== 'canvas' && <div className="filter-bar"><div className="filter-tools"><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por uma lembrança…" aria-label="Buscar lembranças" />{query && <button onClick={() => setQuery('')} aria-label="Limpar busca">×</button>}</div><label className="date-filter"><span className="sr-only">Filtrar por data</span><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label></div><div className="child-filters" aria-label="Filtrar por pessoa"><button className={childFilter === 'all' ? 'chip active-chip' : 'chip'} onClick={() => setChildFilter('all')}>Todos</button>{archive.children.map((person) => <button key={person.id} className={childFilter === person.id ? 'chip active-chip' : 'chip'} onClick={() => setChildFilter(person.id)}><i style={{ background: person.color }} />{person.name}</button>)}</div></div>}

        {(view === 'inicio' || view === 'timeline') && <section className="memories-list" aria-live="polite">
          {memories.length === 0 ? <EmptyState search={query} onCreate={openNewMemory} /> : memories.map((memory, index) => <MemoryCard key={memory.id} memory={memory} person={archive.children.find((item) => item.id === memory.childId)} index={index} onEdit={() => openEdit(memory)} onDelete={() => void removeMemory(memory)} onOpen={() => openEdit(memory)} />)}
        </section>}

        {view === 'album' && <section className="album-grid" aria-live="polite">{memories.length === 0 ? <EmptyState search={query} onCreate={openNewMemory} /> : memories.map((memory, index) => <AlbumCard key={memory.id} memory={memory} person={archive.children.find((item) => item.id === memory.childId)} index={index} onClick={() => openEdit(memory)} />)}</section>}

        {view === 'canvas' && <section className="canvas-panel">
          <div className="canvas-copy"><span className="eyebrow">TUDO SE CONECTA</span><h3>O mapa da nossa<br />pequena grande história</h3><p>Toque em alguém para ver seus momentos; toque num tema para encontrá-lo no arquivo.</p><div className="canvas-key"><span><i className="key-person" /> pessoas</span><span><i className="key-theme" /> temas e capítulos</span></div></div>
          <div className="orbit" aria-label="Mapa interativo de memórias"><svg viewBox="0 0 640 450" role="presentation" className="orbit-lines"><ellipse cx="320" cy="225" rx="245" ry="155" /><ellipse cx="320" cy="225" rx="165" ry="105" transform="rotate(-24 320 225)" />{archive.children.map((person, index) => <line key={person.id} x1="320" y1="225" x2={index === 0 ? 125 : 520} y2={index === 0 ? 133 : 315} />)}</svg><button className="orbit-core" onClick={() => { setChildFilter('all'); setView('timeline'); }}><span>♡</span><small>nossa<br />família</small></button>
            {archive.children.map((person, index) => <button key={person.id} className={`orbit-person orbit-position-${index % 2}`} style={{ left: index % 2 === 0 ? '17%' : '81%', top: index % 2 === 0 ? '30%' : '69%', '--person-color': person.color } as CSSProperties} onClick={() => { setChildFilter(person.id); setView('timeline'); }}><span>{person.name.slice(0, 1)}</span><small>{person.name}</small></button>)}
            {Array.from(new Set(archive.memories.map((item) => item.tag))).slice(0, 5).map((tag, index) => { const positions = [{ left: '49%', top: '13%' }, { left: '70%', top: '30%' }, { left: '67%', top: '82%' }, { left: '35%', top: '80%' }, { left: '29%', top: '49%' }]; return <button key={tag} className={`orbit-tag ${selectedOrbit === tag ? 'selected-orbit' : ''}`} style={positions[index]} onClick={() => { setSelectedOrbit(tag); setTagFilter(tag); setView('timeline'); }}>{tag}<span>{archive.memories.filter((item) => item.tag === tag).length}</span></button>; })}
          </div>
          <div className="canvas-footer"><span>✦</span> Cada lembrança é um fio da nossa história.</div>
        </section>}

        {view === 'arquivo' && <section className="archive-layout"><div className="archive-card"><span className="archive-icon">⌑</span><div className="eyebrow">ARQUIVO PRIVADO</div><h3>Sua história fica<br />com vocês.</h3><p>Memórias e arquivos ficam guardados neste navegador. Não enviamos nada para a nuvem. Para proteger suas recordações, faça uma cópia de segurança de vez em quando.</p><div className="storage-detail"><span><b>{mediaCount}</b> arquivos locais</span><span><b>{formatBytes(totalBytes)}</b> ocupados por mídia</span><span><b>{archive.memories.length}</b> lembranças</span></div><button className="button-primary" onClick={() => void exportArchive()}>↓ Baixar cópia de segurança</button><label className="button-outline import-backup">↑ Restaurar uma cópia<input type="file" accept="application/json,.json" onChange={(event) => void importArchive(event)} /></label><small className="fine-print">A restauração substitui o arquivo atual neste dispositivo.</small></div>
          <div className="archive-side"><div className="side-card"><span className="eyebrow">SUAS FOTOS E ARQUIVOS</span><h3>Com você, mesmo sem internet.</h3><p>Quando você anexa uma foto, vídeo, áudio ou PDF, os próprios arquivos são guardados junto das memórias neste navegador.</p><div className="offline-callout"><span>✿</span><p><strong>{online ? 'Disponível offline neste dispositivo' : 'Você está offline — seu arquivo segue disponível'}</strong><small>Os links externos são apenas atalhos: para vê-los, será preciso internet.</small></p></div></div>
          <div className="side-card integrations"><span className="eyebrow">CONECTORES OPCIONAIS</span><h3>Importar da nuvem</h3><p>Conexões protegidas exigem configuração OAuth do responsável pelo app. Ainda não estão ativadas nesta demonstração.</p><button className="provider-row" onClick={() => void connectProvider('OneDrive')}><span className="provider-mark onedrive">▧</span><span><strong>OneDrive</strong><small>Importação após configurar OAuth</small></span><span>↗</span></button><button className="provider-row" onClick={() => void connectProvider('Google Drive')}><span className="provider-mark drive">△</span><span><strong>Google Drive</strong><small>Importação após configurar OAuth</small></span><span>↗</span></button>{cloudNotice && <div className="notice" role="status">{cloudNotice}</div>}</div></div></section>}

        <footer className="page-footer"><span>Feito para guardar o que importa. <b>♡</b></span><span><i className={`status-dot ${online ? '' : 'offline'}`} />{online ? 'Sempre seu. Mesmo sem internet.' : 'Offline e com você.'}</span></footer>
      </main>

      {draft && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }}><form className="memory-modal" onSubmit={(event) => void saveMemory(event)} aria-labelledby="modal-title"><div className="modal-top"><div><div className="eyebrow">{draft.id ? 'EDITAR UMA HISTÓRIA' : 'UM MOMENTO PARA GUARDAR'}</div><h2 id="modal-title">{draft.id ? 'Ajuste os detalhes' : 'Uma nova lembrança'}</h2></div><button type="button" className="modal-close" onClick={() => setDraft(null)} aria-label="Fechar">×</button></div><label>Título<input required maxLength={100} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="O que você quer lembrar?" autoFocus /></label><div className="form-two"><label>Data<input required type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label>Quem?<select value={draft.childId} onChange={(event) => setDraft({ ...draft, childId: event.target.value })}>{archive.children.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label></div><label>Capítulo ou tema<input maxLength={40} value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} placeholder="Primeiros dias, família…" /></label><label>A história<textarea rows={4} maxLength={1500} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Palavras, detalhes ou sentimentos que você quer guardar…" /></label>
        <div className="attachments-area"><div className="attachments-heading"><strong>Fotos e arquivos</strong><small>Guardados só neste dispositivo · até 20 MB cada</small></div>{draft.attachments.length > 0 && <ul className="attachment-list">{draft.attachments.map((item) => <AttachmentRow key={item.id} item={item} onRemove={() => setDraft({ ...draft, attachments: draft.attachments.filter((file) => file.id !== item.id) })} />)}</ul>}{importProgress && <div className="progress-label" role="status">{importProgress}</div>}<div className="attachment-actions"><label className="button-outline file-picker">＋ Adicionar arquivos<input type="file" accept="image/*,video/*,audio/*,application/pdf" multiple onChange={(event) => void addFiles(event)} /></label><button type="button" className="link-button" onClick={() => setShowLink(!showLink)}>↗ Adicionar link</button></div>{showLink && <div className="link-form"><input type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" aria-label="Link externo" required /><button className="button-primary" type="button" onClick={() => { const field = document.querySelector<HTMLInputElement>('.link-form input'); if (field?.reportValidity()) addLink(); }}>Anexar link</button></div>}</div>
        <div className="modal-actions"><button className="button-quiet" type="button" onClick={() => setDraft(null)}>Cancelar</button><button className="button-primary" type="submit">{draft.id ? 'Salvar alterações' : 'Guardar lembrança'}</button></div></form></div>}
      {error && <div className="toast error-toast" role="alert"><span>!</span>{error}<button onClick={() => setError('')} aria-label="Fechar aviso">×</button></div>}
      {toast && !error && <div className="toast" role="status"><span>✓</span>{toast}<button onClick={() => setToast('')} aria-label="Fechar aviso">×</button></div>}
    </div>
  );
}

function MemoryCard({ memory, person, index, onEdit, onDelete, onOpen }: { memory: Memory; person?: Child; index: number; onEdit: () => void; onDelete: () => void; onOpen: () => void }) {
  const cover = memory.attachments.find((item) => item.local && item.blob?.type.startsWith('image/'));
  const coverUrl = useObjectUrl(cover?.blob);
  return <article className="memory-card">
    <div className="memory-date"><span>{new Date(`${memory.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}</span><small>{new Date(`${memory.date}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></div>
    {cover ? <button className="memory-cover" onClick={onOpen} aria-label={`Abrir ${memory.title}`}><img src={coverUrl} alt={`Foto de ${memory.title}`} /></button> : <button className={`memory-art art-${index % 4}`} onClick={onOpen} aria-label={`Abrir ${memory.title}`}><span>{['✿', '☼', '♡', '✳'][index % 4]}</span><i>{['um dia para lembrar', 'do nosso caderno', 'pequenos milagres', 'bem juntinhos'][index % 4]}</i></button>}
    <div className="memory-copy"><div className="memory-meta"><span className="memory-tag">{memory.tag}</span><span>{fmtDate(memory.date)}</span></div><button className="memory-title" onClick={onOpen}>{memory.title}</button><p>{memory.description || 'Um momento guardado com carinho.'}</p><div className="memory-bottom"><span className="memory-person"><i style={{ background: person?.color }} />{person?.name ?? 'Família'}</span><span className="memory-media">{memory.attachments.length > 0 && <><b>{memory.attachments.filter((item) => item.local).length > 0 ? '▧' : '↗'}</b> {memory.attachments.length} {memory.attachments.length === 1 ? 'anexo' : 'anexos'}</>}</span><div className="card-actions"><button onClick={onEdit} aria-label={`Editar ${memory.title}`} title="Editar">✎</button><button onClick={onDelete} aria-label={`Excluir ${memory.title}`} title="Excluir">×</button></div></div></div>
  </article>;
}

function AlbumCard({ memory, person, index, onClick }: { memory: Memory; person?: Child; index: number; onClick: () => void }) {
  const photo = memory.attachments.find((item) => item.local && item.blob?.type.startsWith('image/'));
  const photoUrl = useObjectUrl(photo?.blob);
  return <button className="album-card" onClick={onClick}><div className={`album-image album-art-${index % 5}`}>{photo ? <img src={photoUrl} alt="" /> : <><span>{['✿', '☼', '♡', '✳', '❋'][index % 5]}</span><small>{['um dia doce', 'o nosso começo', 'luz da manhã', 'com todo amor', 'para sempre'][index % 5]}</small></>}<span className="album-count">{memory.attachments.filter((item) => item.local).length || '♡'}</span></div><div className="album-caption"><span>{memory.tag} · {fmtDate(memory.date)}</span><strong>{memory.title}</strong><small>{person?.name ?? 'Família'}</small></div></button>;
}

function AttachmentRow({ item, onRemove }: { item: Attachment; onRemove: () => void }) {
  const fileUrl = useObjectUrl(item.blob);
  const preview = item.blob?.type.startsWith('image/') ? fileUrl : '';
  const href = item.local ? fileUrl : item.link;
  return <li>{preview ? <img src={preview} alt="" /> : <span className="file-icon">{item.local ? '▤' : '↗'}</span>}<span>{href ? <a href={href} download={item.local ? item.name : undefined} target={item.local ? undefined : '_blank'} rel={item.local ? undefined : 'noreferrer'}><strong>{item.name}</strong></a> : <strong>{item.name}</strong>}<small>{item.local ? `${formatBytes(item.size)} · guardado localmente` : 'Link externo · requer internet'}</small></span><button type="button" aria-label={`Remover ${item.name}`} onClick={onRemove}>×</button></li>;
}

function EmptyState({ search, onCreate }: { search: string; onCreate: () => void }) {
  return <div className="empty-state"><span>✿</span><h3>{search ? 'Ainda não encontramos essa lembrança.' : 'Toda história começa com um primeiro registro.'}</h3><p>{search ? 'Tente outra palavra, pessoa ou capítulo.' : 'Quando quiser, guarde aqui um detalhe pequeno que merece ficar.'}</p>{!search && <button className="button-primary" onClick={onCreate}>＋ Guardar a primeira lembrança</button>}</div>;
}

function formatBytes(bytes: number) { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`; }
function useObjectUrl(blob?: Blob) { const [url, setUrl] = useState(''); useEffect(() => { if (!blob) { setUrl(''); return; } const objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl); }, [blob]); return url; }
function download(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function blobToData(blob: Blob): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }); }
function dataToBlob(data: string, type: string) { const binary = atob(data); const bytes = new Uint8Array(binary.length); for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index); return new Blob([bytes], { type }); }

export default App;
