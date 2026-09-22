import type { AuthRepo, LoginRow } from './repo.ts';

/**
 * In-memory `AuthRepo` for `dev-server.ts` and Playwright (Step 3.2): one ADM user, one USER
 * user, one regeneration password. Plain-text compare only — never used by the Docker image.
 */
export function devAuthRepo(): AuthRepo {
  const users: Record<string, { password: string; row: LoginRow }> = {
    DEV: { password: 'dev', row: { USERNAME: 'DEV', NOME: 'Utilizador de administração', TIPO_UTILIZADOR_RF: 'ADM', OK: 1, ATIVO: 1 } },
    USER1: { password: 'user1', row: { USERNAME: 'USER1', NOME: 'Utilizador padrão', TIPO_UTILIZADOR_RF: 'USER', OK: 1, ATIVO: 1 } },
  };
  let regeneracao = 'segredo123';

  return {
    async findLogin(username, password) {
      const found = users[username];
      if (!found) return undefined;
      return { ...found.row, OK: password === found.password ? 1 : 0 };
    },

    async checkRegeneracao(password) {
      return password === regeneracao;
    },

    async setRegeneracao(actual, nova) {
      if (actual !== regeneracao) return false;
      regeneracao = nova;
      return true;
    },
  };
}
