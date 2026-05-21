const API_BASE = "http://localhost:8001";

export async function fetchLibraryContents() {
  const res = await fetch(`${API_BASE}/library`);
  if (!res.ok) throw new Error("Failed to fetch library");
  return res.json();
}

export async function logLibraryInteraction(payload) {
  const res = await fetch(`${API_BASE}/library/interaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to log interaction");
  }
}