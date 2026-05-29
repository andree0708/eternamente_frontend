import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { hashPasswordForTransport } from '../../lib/password';
import { mapAuthError, validateEmail, validateFullName, validatePassword } from '../../lib/validation';
import '../../styles/auth.css';

type Tab = 'login' | 'register';

export function AuthPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr) errors.email = emailErr;
    if (passErr) errors.password = passErr;
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setMessage({ text: 'Revisa los campos marcados.', type: 'error' });
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setMessage(null);
    try {
      const passwordHash = await hashPasswordForTransport(password);
      const result = await api<{ token: string; userId: string; email: string; fullName: string }>(
        '/api/auth/login',
        'POST',
        { email, password: passwordHash },
        false
      );
      if (!result.token) throw new Error('No se recibió token de sesión');
      localStorage.setItem('eternamente_token', result.token);
      localStorage.setItem(
        'eternamente_user',
        JSON.stringify({ id: result.userId, email: result.email, fullName: result.fullName })
      );
      setMessage({ text: 'Bienvenido. Redirigiendo…', type: 'success' });
      window.location.href = '/games';
    } catch (err) {
      setMessage({ text: mapAuthError(err), type: 'error' });
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
    const ageStr = (form.elements.namedItem('regAge') as HTMLInputElement).value;
    const age = ageStr ? parseInt(ageStr, 10) : 0;

    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const nameErr = validateFullName(fullName);
    if (emailErr) errors.regEmail = emailErr;
    if (passErr) errors.regPassword = passErr;
    if (nameErr) errors.regName = nameErr;
    if (!age || age < 1 || age > 120) errors.regAge = 'Ingresa una edad válida (1-120)';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setMessage({ text: 'Revisa los campos marcados.', type: 'error' });
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setMessage(null);
    try {
      const passwordHash = await hashPasswordForTransport(password);
      const result = await api<{ token: string; userId: string; email: string; fullName: string; age: number }>(
        '/api/users',
        'POST',
        { email, password: passwordHash, fullName, role: 'PATIENT', age },
        false
      );
      if (!result.token) throw new Error('No se recibió token de sesión');
      localStorage.setItem('eternamente_token', result.token);
      localStorage.setItem(
        'eternamente_user',
        JSON.stringify({ id: result.userId, email: result.email, fullName: result.fullName, age: result.age })
      );
      setMessage({ text: 'Cuenta creada. Redirigiendo…', type: 'success' });
      window.location.href = '/games';
    } catch (err) {
      setMessage({ text: mapAuthError(err), type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg" />
      <div className="auth-page__card fade-in">
        <div className="auth-page__brand">
          <img src="/logo.svg" alt="EternaMente" className="auth-page__logo-img" width={80} height={80} />
          <h1>EternaMente</h1>
          <p>Evaluación cognitiva para el adulto mayor</p>
        </div>

        <div className="auth-page__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            className={tab === 'login' ? 'active' : ''}
            onClick={() => { setTab('login'); setMessage(null); setFieldErrors({}); }}
            disabled={loading}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'register'}
            className={tab === 'register' ? 'active' : ''}
            onClick={() => { setTab('register'); setMessage(null); setFieldErrors({}); }}
            disabled={loading}
          >
            Registrarse
          </button>
        </div>

        {tab === 'login' ? (
          <form className="auth-page__form" onSubmit={handleLogin} noValidate>
            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                autoComplete="email"
                className={`input ${fieldErrors.email ? 'input--error' : ''}`}
                placeholder="tu@email.com"
                disabled={loading}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <span className="auth-page__field-error">{fieldErrors.email}</span>}
            </label>
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className={`input ${fieldErrors.password ? 'input--error' : ''}`}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && <span className="auth-page__field-error">{fieldErrors.password}</span>}
            </label>
            <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="auth-page__form" onSubmit={handleRegister} noValidate>
            <label>
              Correo electrónico
              <input
                name="regEmail"
                type="email"
                autoComplete="email"
                className={`input ${fieldErrors.regEmail ? 'input--error' : ''}`}
                placeholder="tu@email.com"
                disabled={loading}
              />
              {fieldErrors.regEmail && <span className="auth-page__field-error">{fieldErrors.regEmail}</span>}
            </label>
            <label>
              Contraseña
              <input
                name="regPassword"
                type="password"
                autoComplete="new-password"
                className={`input ${fieldErrors.regPassword ? 'input--error' : ''}`}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
              {fieldErrors.regPassword && <span className="auth-page__field-error">{fieldErrors.regPassword}</span>}
            </label>
            <label>
              Nombre completo
              <input
                name="regName"
                type="text"
                autoComplete="name"
                className={`input ${fieldErrors.regName ? 'input--error' : ''}`}
                placeholder="Tu nombre"
                disabled={loading}
              />
              {fieldErrors.regName && <span className="auth-page__field-error">{fieldErrors.regName}</span>}
            </label>
            <label>
              Edad
              <input
                name="regAge"
                type="number"
                min={1}
                max={120}
                className={`input ${fieldErrors.regAge ? 'input--error' : ''}`}
                placeholder="Ej: 65"
                disabled={loading}
              />
              {fieldErrors.regAge && <span className="auth-page__field-error">{fieldErrors.regAge}</span>}
            </label>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {message && (
          <div
            className={`auth-page__message auth-page__message--${message.type}`}
            role="alert"
            aria-live="polite"
          >
            {message.text}
          </div>
        )}
      </div>
      <footer className="auth-page__footer">
        Herramienta de apoyo — no sustituye evaluación médica profesional
      </footer>
    </div>
  );
}
