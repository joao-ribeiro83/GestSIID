import { z } from 'zod';

/**
 * Env schema for every variable in .env.example (ARCHITECTURE.md §2). Numbers and booleans
 * arrive as strings from process.env, so numeric/boolean fields go through z.coerce; every
 * field keeps its documented default and validation rule (Oracle identifier for DB_SCHEMA,
 * minimum length for SESSION_SECRET, etc). The `UV_THREADPOOL_SIZE >= DB_POOL_SIZE` rule is a
 * cross-field .refine because the boot sequence must refuse to start otherwise.
 */

const ORACLE_IDENTIFIER_RE = /^[A-Z][A-Z0-9_$#]{0,29}$/;
const BASE_PATH_RE = /^$|^\/.+/;
const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    BASE_PATH: z
      .string()
      .regex(BASE_PATH_RE, "BASE_PATH must be '' or start with '/' (D-09)")
      .default(''),

    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_CONNECT_STRING: z.string().min(1),
    DB_SCHEMA: z
      .string()
      .regex(ORACLE_IDENTIFIER_RE, 'DB_SCHEMA must be a valid Oracle identifier (D-02)'),
    AMBIENTE_ID: z.string().min(1),
    DB_POOL_SIZE: z.coerce.number().int().positive().default(4),
    DB_CALL_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
    UV_THREADPOOL_SIZE: z.coerce.number().int().positive().default(8),
    ORACLE_CLIENT_LIB_DIR: z.string().default(''),

    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
    // z.stringbool, not z.coerce.boolean: Boolean('false') is true.
    COOKIE_SECURE: z.stringbool().default(false),
    // The reverse proxy's address(es) / CIDR, comma-separated, or 'false'. Never 'true': that
    // takes the leftmost X-Forwarded-For entry, which the client writes (defeats the login throttle).
    TRUST_PROXY: z
      .string()
      .default('false')
      .refine((v) => v !== 'true', "TRUST_PROXY must list the proxy address(es), not 'true'")
      .transform((v) => (['', 'false', '0'].includes(v) ? false : v)),

    FILESERVER_BASE_URL: z.url(),
    FILESERVER_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

    UPLOAD_MAX_MB: z.coerce.number().int().positive().default(10),
  })
  .refine((env) => env.UV_THREADPOOL_SIZE >= env.DB_POOL_SIZE, {
    error: 'UV_THREADPOOL_SIZE must be >= DB_POOL_SIZE',
    path: ['UV_THREADPOOL_SIZE'],
  });

export type Config = z.infer<typeof envSchema>;

export class ConfigError extends Error {
  constructor(issues: z.ZodIssue[]) {
    const lines = issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    super(`Invalid environment configuration:\n${lines.join('\n')}`);
    this.name = 'ConfigError';
  }
}

/** Pure parse: throws {@link ConfigError} with every invalid/missing variable listed. */
export function parseConfig(env: Record<string, string | undefined>): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(result.error.issues);
  }
  return result.data;
}

/** Boot entry point: parses process.env, prints a readable message and exits 1 on failure. */
export function loadConfig(): Config {
  try {
    return parseConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}
