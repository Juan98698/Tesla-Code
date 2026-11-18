import vm from 'node:vm';
import { javascriptWorker } from '../../js/repositories/javascript-runner.js';
import { prepareBindingCases } from '../../js/domain/javascript-contract.js';

// Runs trusted repository examples with the same worker evaluator, using V8's
// classic-script semantics. Browser tests separately exercise actual Worker/CSP.
function runSandbox(
  code,
  item = { name: 'programa', stdout: '' },
  exploratory = false,
  entrypoint,
  bindings,
  syntax,
) {
  if ((bindings || syntax) && !exploratory) {
    item = prepareBindingCases(code, [item], bindings, syntax)[0];
    code = item.source;
  }
  const messages = [],
    blobs = new Map();
  let execution;
  let context,
    serial = 0;
  const sandbox = {
    performance,
    setTimeout,
    Blob: class {
      constructor(parts) {
        this.source = parts.join('');
      }
    },
    URL: {
      createObjectURL(blob) {
        const id = 'blob:' + ++serial;
        blobs.set(id, blob.source);
        return id;
      },
      revokeObjectURL(id) {
        blobs.delete(id);
      },
    },
    postMessage(message) {
      messages.push(JSON.parse(JSON.stringify(message)));
    },
    importScripts(url) {
      new vm.Script(blobs.get(url), { filename: 'teslacode-ejercicio.js' }).runInContext(context, {
        timeout: 200,
      });
    },
  };
  sandbox.self = sandbox;
  context = vm.createContext(sandbox);
  const keys = ['self', 'Blob', 'URL', 'importScripts'];
  const previous = new Map(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  try {
    for (const key of keys)
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value: sandbox[key],
      });
    javascriptWorker();
    execution = sandbox.onmessage({ data: { code, item, exploratory, entrypoint } });
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
  return { execution, messages, blobs };
}

const resultOf = ({ messages, blobs }) => ({
  result: messages.find((message) => message.type === 'result').result,
  messages,
  blobs,
});

export function runJavaScript(...args) {
  return resultOf(runSandbox(...args));
}

export async function runJavaScriptAsync(...args) {
  const run = runSandbox(...args);
  await run.execution;
  return resultOf(run);
}

export async function solveJavaScriptActivity(page, activity) {
  const section = page.locator(`[data-activity="${activity.id}"]`);
  await section.locator('.code-editor').fill(activity.solution);
  await section.locator('[data-check]').click();
  await page.waitForFunction(
    (id) =>
      document
        .querySelector(`[data-activity="${id}"] .practice-feedback`)
        ?.classList.contains('ok'),
    activity.id,
  );
}
