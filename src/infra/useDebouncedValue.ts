import { useEffect, useState } from "react";

const useDebouncedValue = <T>(input: T, delayMs: number): T => {
  const [value, setValue] = useState(input);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValue(input);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, input]);

  return value;
};

export { useDebouncedValue };
