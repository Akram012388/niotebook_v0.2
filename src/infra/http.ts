type HttpResponse = {
  ok: boolean;
  status: number;
  text: string;
};

const fetchText = async (url: string): Promise<HttpResponse> => {
  const response = await fetch(url);
  const text = await response.text();

  return { ok: response.ok, status: response.status, text };
};

export type { HttpResponse };
export { fetchText };
