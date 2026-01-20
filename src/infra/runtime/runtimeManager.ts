import { initCExecutor } from "./cExecutor";
import { initHtmlExecutor } from "./htmlExecutor";
import { initJsExecutor } from "./jsExecutor";
import { initPythonExecutor } from "./pythonExecutor";
import type {
  RuntimeExecutor,
  RuntimeLanguage,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

const executorMap: Partial<Record<RuntimeLanguage, RuntimeExecutor>> = {};

const loadExecutor = async (
  language: RuntimeLanguage,
): Promise<RuntimeExecutor> => {
  if (executorMap[language]) {
    return executorMap[language] as RuntimeExecutor;
  }

  let executor: RuntimeExecutor;

  switch (language) {
    case "js":
      executor = await initJsExecutor();
      break;
    case "html":
      executor = await initHtmlExecutor();
      break;
    case "python":
      executor = await initPythonExecutor();
      break;
    case "c":
      executor = await initCExecutor();
      break;
    default:
      executor = await initJsExecutor();
  }

  executorMap[language] = executor;
  await executor.init();

  return executor;
};

const runRuntime = async (
  language: RuntimeLanguage,
  input: RuntimeRunInput,
): Promise<RuntimeRunResult> => {
  const executor = await loadExecutor(language);
  return executor.run(input);
};

const stopRuntime = async (language: RuntimeLanguage): Promise<void> => {
  const executor = executorMap[language];

  if (!executor) {
    return;
  }

  executor.stop();
};

export { loadExecutor, runRuntime, stopRuntime };
