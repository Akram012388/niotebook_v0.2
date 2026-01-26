type PromptNeutralizationResult = {
  text: string;
  flagged: boolean;
};

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all|any|previous) instructions/gi,
  /system prompt/gi,
  /developer message/gi,
  /jailbreak/gi,
  /do anything now/gi,
  /act as/gi,
  /pretend to be/gi,
  /reveal (the )?(system|hidden) prompt/gi,
  /disclose (the )?(system|hidden) prompt/gi,
  /bypass (the )?(rules|policy|policies)/gi,
];

const neutralizePromptInjection = (
  value: string,
): PromptNeutralizationResult => {
  let next = value;
  let flagged = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(next)) {
      flagged = true;
      next = next.replace(pattern, "[redacted]");
    }
  }

  return { text: next, flagged };
};

export type { PromptNeutralizationResult };
export { neutralizePromptInjection };
