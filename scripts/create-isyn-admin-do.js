const path = require('path');
const { spawnSync } = require('child_process');

const cwd = path.resolve(__dirname, '..');
const env = {
  ...process.env,
  DOTENV_CONFIG_PATH: path.join(cwd, '.env.do'),
};
const tsxCli = path.join(cwd, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const script = path.join(cwd, 'scripts', 'create-isyn-admin.ts');
const r = spawnSync(process.execPath, [tsxCli, script], {
  cwd,
  env,
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
