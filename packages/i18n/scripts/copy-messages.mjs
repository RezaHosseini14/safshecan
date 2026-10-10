import { cpSync } from 'node:fs';

cpSync(new URL('../messages', import.meta.url), new URL('../dist/messages', import.meta.url), {
  recursive: true,
});
