import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
          <div className="text-center" style={{ maxWidth: 400, padding: 32 }}>
            <div className="mx-auto flex items-center justify-center" style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--color-danger-bg)', marginBottom: 20 }}>
              <span style={{ fontSize: 36 }}>⚠️</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-strong)', marginBottom: 8 }}>Algo deu errado</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Ocorreu um erro inesperado. Seus dados estão seguros. Tente recarregar a página.
            </p>
            <button onClick={() => window.location.reload()}
              style={{ background: 'var(--color-green-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Recarregar página
            </button>
            <br />
            <button onClick={() => this.setState({ hasError: false, error: null })}
              style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13 }}>
              Tentar novamente sem recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
