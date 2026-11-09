import { spawnSync } from 'node:child_process';
const executable = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const result = spawnSync(executable, ['-X', 'utf8', 'tests/python-examples.py'], {
  stdio: 'inherit',
});
if (result.error) {
  console.error(
    'No se pudo iniciar Python. Instálalo o indica su ejecutable en PYTHON. ' +
      result.error.message,
  );
}
process.exit(result.status ?? 1);
