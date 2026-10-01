import { z } from 'zod';

/**
 * Zod's built-in messages are English ("Too small: expected string to have >=1 characters").
 * A schema with its own message keeps it (resource.ts sets them); any other one — ad-hoc route
 * bodies such as /auth/regeneracao-password — falls back to the app's Portuguese texts.
 */
z.config({
  customError: (iss) => {
    if (iss.input == null || (iss.code === 'too_small' && iss.origin === 'string' && Number(iss.minimum) <= 1))
      return 'Campo obrigatório.';
    if (iss.code === 'too_big' && iss.origin === 'string') return `Máximo ${iss.maximum} caracteres.`;
    return 'Valor inválido.';
  },
});
