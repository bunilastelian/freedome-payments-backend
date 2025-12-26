import fetch from "node-fetch";

export async function piRequest({ base, path, method="GET", apiKey, bearer, jsonBody }) {
  const url = `${base}${path}`;
  const headers = { "accept": "application/json" };
  if (apiKey) headers["Authorization"] = `Key ${apiKey}`;
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  if (jsonBody !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.error || data?.message || data?.raw || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
