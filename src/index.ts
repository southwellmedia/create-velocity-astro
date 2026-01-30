import { run } from './cli.js';

run(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exit(1);
});
