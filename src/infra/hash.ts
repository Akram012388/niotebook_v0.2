const hashString = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
};

export { hashString };
