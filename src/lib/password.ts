/** SHA-256 en hex antes de enviar al servidor (HTTPS + BCrypt en backend). */
export async function hashPasswordForTransport(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
