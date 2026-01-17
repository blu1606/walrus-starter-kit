import kleur from 'kleur';

export const logger = {
  info: (msg: string) => console.log(kleur.blue('ℹ'), msg),
  success: (msg: string) => console.log(kleur.green('✓'), msg),
  error: (msg: string) => console.error(kleur.red('✗'), msg),
  warn: (msg: string) => console.warn(kleur.yellow('⚠'), msg),
};
