import { AsyncLocalStorage } from 'node:async_hooks';

const context = new AsyncLocalStorage();

export const runWithAuditContext = (value, callback) => context.run(value, callback);
export const getAuditContext = () => context.getStore() || null;

