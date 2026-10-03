import { IRepository } from './repository.interface.js';
import { JsonRepository } from './json.repository.js';
import { PostgresRepository } from './postgres.repository.js';

let defaultRepoInstance = null;

export function createRepository(options = {}) {
  const dbUrl = options.databaseUrl || process.env.DATABASE_URL;
  if (dbUrl) {
    console.log('[DatabaseFactory] Initializing PostgreSQL Repository (DATABASE_URL configured)');
    return new PostgresRepository(dbUrl, options);
  }
  return new JsonRepository(options.dbFile, options.helpers || {});
}

export function getRepository(helpers = {}) {
  if (!defaultRepoInstance) {
    defaultRepoInstance = createRepository({ helpers });
  }
  return defaultRepoInstance;
}

export function setRepository(repo) {
  defaultRepoInstance = repo;
}

export { IRepository, JsonRepository, PostgresRepository };
