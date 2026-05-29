const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_MAX = 254;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;
const NAME_MIN = 2;
const NAME_MAX = 100;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Escribe tu correo electrónico.';
  if (!EMAIL_RE.test(value)) return 'El correo no tiene un formato válido.';
  if (value.length > EMAIL_MAX) return `El correo no puede tener más de ${EMAIL_MAX} caracteres.`;
  return null;
}

export function validatePassword(password: string, min = PASSWORD_MIN): string | null {
  if (!password) return 'Escribe tu contraseña.';
  if (password.length < min) return `La contraseña debe tener al menos ${min} caracteres.`;
  if (password.length > PASSWORD_MAX) return `La contraseña no puede tener más de ${PASSWORD_MAX} caracteres.`;
  return null;
}

export function validateFullName(name: string): string | null {
  const value = name.trim();
  if (!value) return 'Escribe tu nombre completo.';
  if (value.length < NAME_MIN) return 'El nombre es demasiado corto.';
  if (value.length > NAME_MAX) return `El nombre no puede tener más de ${NAME_MAX} caracteres.`;
  return null;
}

export function mapAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'No se pudo completar la operación. Intenta de nuevo.';
  const msg = err.message.toLowerCase();
  if (msg.includes('401') || msg.includes('incorrectos') || msg.includes('no autorizado')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (msg.includes('409') || msg.includes('registrado')) {
    return 'Este correo ya está registrado. Prueba iniciar sesión.';
  }
  if (msg.includes('validación') || msg.includes('validation') || msg.includes('inválid')) {
    return err.message;
  }
  if (msg.includes('conectar') || msg.includes('fetch')) {
    return 'No hay conexión con el servidor. Revisa tu internet o inténtalo más tarde.';
  }
  return err.message;
}
