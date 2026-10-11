import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

type BoundaryState = { hasError: boolean };

/** Keep an actionable screen visible if a component throws during rendering. */
class AppErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Falha inesperada ao renderizar o Kids Life Canvas.', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" style={{ maxWidth: 640, margin: '12vh auto', padding: 24, color: '#3d423b', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
          <h1>Não foi possível exibir esta tela.</h1>
          <p>Seu arquivo local não foi apagado por esta falha. Recarregue a aplicação; se o problema continuar, abra novamente em uma aba atualizada e exporte uma cópia assim que o app voltar.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #687f69', background: '#687f69', color: '#fff', cursor: 'pointer' }}>
            Recarregar aplicação
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('Não foi possível preparar o uso offline do app shell.', error);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<main style="max-width:640px;margin:12vh auto;padding:24px;font-family:system-ui,sans-serif"><h1>Estrutura da página incompleta</h1><p>O elemento principal da aplicação não foi encontrado. Atualize a página; se o problema continuar, verifique a publicação do site.</p></main>';
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>
  );
}
