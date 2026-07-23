import { Component } from 'react';

// ─────────────────────────────────────────────────────────────
// ErrorBoundary — Captura errores de renderizado en el árbol de
// React y muestra una pantalla de recuperación en lugar de dejar
// la aplicación en blanco.
// ─────────────────────────────────────────────────────────────
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En producción aquí se enviaría a un servicio de monitoreo (Sentry, etc.)
    console.error('ErrorBoundary capturó un error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
            <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Algo salió mal</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Ocurrió un error inesperado en la aplicación. Puedes intentar recargar la página.
          </p>
          {this.state.error?.message && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-slate-100 px-3 py-2 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => window.location.reload()} className="btn-primary">
              Recargar página
            </button>
            <button onClick={this.handleReset} className="btn-secondary">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
