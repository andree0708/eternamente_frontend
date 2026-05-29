import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  gameType?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Error en juego ${this.props.gameType || ''}:`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleBack = () => {
    window.location.href = '/games';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="game-complete">
          <div className="game-complete__icon">⚠️</div>
          <h2>Algo salió mal</h2>
          <p className="game-complete__hint">
            {this.state.error?.message || 'Error inesperado al cargar el juego.'}
          </p>
          <div className="game-app__actions" style={{ flexDirection: 'column', gap: 12 }}>
            <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
              Reintentar
            </button>
            <button type="button" className="btn btn-outline" onClick={this.handleBack}>
              Volver al menú
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
