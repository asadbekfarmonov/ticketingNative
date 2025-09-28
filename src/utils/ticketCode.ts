const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateHumanCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
