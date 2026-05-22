import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import '../../styles/auth.css';

type Tab = 'login' | 'register';

export function AuthPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const token = localStorage.getItem('eternamente_token');
  const user = localStorage.getItem('eternamente_user');
  if (token && user) {
    window.location.href = '/games';
    return null;
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    if (!email || !password) {
      setMessage({ text: 'Completa todos los campos.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await api<{ token: string; userId: string; email: string; fullName: string }>(
        '/api/auth/login',
        'POST',
        { email, password },
        false
      );
      if (!result.token) throw new Error('No se recibió token');
      localStorage.setItem('eternamente_token', result.token);
      localStorage.setItem(
        'eternamente_user',
        JSON.stringify({ id: result.userId, email: result.email, fullName: result.fullName })
      );
      setMessage({ text: '¡Bienvenido! Redirigiendo...', type: 'success' });
      window.location.href = '/games';
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Error al iniciar sesión',
        type: 'error',
      });
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    const email = (form.elements.namedItem('regEmail') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('regPassword') as HTMLInputElement).value;
    const fullName = (form.elements.namedItem('regName') as HTMLInputElement).value.trim();
    if (!email || !password || !fullName) {
      setMessage({ text: 'Completa todos los campos.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await api<{ token: string; userId: string; email: string; fullName: string }>(
        '/api/users',
        'POST',
        { email, password, fullName, role: 'PATIENT' },
        false
      );
      if (!result.token) throw new Error('No se recibió token');
      localStorage.setItem('eternamente_token', result.token);
      localStorage.setItem(
        'eternamente_user',
        JSON.stringify({ id: result.userId, email: result.email, fullName: result.fullName })
      );
      setMessage({ text: '¡Cuenta creada! Redirigiendo...', type: 'success' });
      window.location.href = '/games';
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Error al registrarse',
        type: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg" />
      <div className="auth-page__card fade-in">
        <div className="auth-page__brand">
          <div className="auth-page__logo">◉</div>
          <h1>EternaMente</h1>
          <p>Evaluación Cognitiva</p>
        </div>

        <div className="auth-page__tabs">
          <button
            type="button"
            className={tab === 'login' ? 'active' : ''}
            onClick={() => { setTab('login'); setMessage(null); }}
            disabled={loading}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={tab === 'register' ? 'active' : ''}
            onClick={() => { setTab('register'); setMessage(null); }}
            disabled={loading}
          >
            Registrarse
          </button>
        </div>

        {tab === 'login' ? (
          <form className="auth-page__form" onSubmit={handleLogin}>
            <label>
              Correo electrónico
              <input name="email" type="email" className="input" placeholder="tu@email.com" required disabled={loading} />
            </label>
            <label>
              Contraseña
              <input name="password" type="password" className="input" placeholder="••••••••" required disabled={loading} />
            </label>
            <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="auth-page__form" onSubmit={handleRegister}>
            <label>
              Correo electrónico
              <input name="regEmail" type="email" className="input" placeholder="tu@email.com" required disabled={loading} />
            </label>
            <label>
              Contraseña
              <input name="regPassword" type="password" className="input" placeholder="••••••••" required disabled={loading} />
            </label>
            <label>
              Nombre completo
              <input name="regName" type="text" className="input" placeholder="Tu nombre" required disabled={loading} />
            </label>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {message && (
          <div className={`auth-page__message auth-page__message--${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
      <footer className="auth-page__footer">
        Sistema de evaluación cognitiva para el adulto mayor
      </footer>
    </div>
  );
}
