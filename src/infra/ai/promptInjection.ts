type PromptNeutralizationResult = {
  text: string;
  flagged: boolean;
};

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all|a[n]y|previous) instructions/i,
  /system prompt/i,
  /developer message/i,
  /jailbreak/i,
  /do anything now/i,
  /act as/i,
  /pretend to be/i,
  /reveal (the )?(system|hidden) prompt/i,
  /disclose (the )?(system|hidden) prompt/i,
  /bypass (the )?(rules|policy|policies)/i,
];

const neutralizePromptInjection = (
  value: string,
): PromptNeutralizationResult => {
  let next = value;
  let flagged = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(next)) {
      flagged = true;
      // Use gi flags for replace to strip ALL occurrences. The patterns
      // themselves use only the i flag (no g) so .test() above won't
      // advance lastIndex between calls.
      next = next.replace(new RegExp(pattern.source, "gi"), "[redacted]");
    }
  }

  return { text: next, flagged };
};

export type { PromptNeutralizationResult };
export { neutralizePromptInjection };
