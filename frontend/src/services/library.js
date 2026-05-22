const API_BASE = "http://localhost:8001";

/**
 * Fetches all library guidelines and resources.
 * @returns {Promise<Array>} List of library items.
 */
export async function fetchLibraryContents() {
  const res = await fetch(`${API_BASE}/library`);
  if (!res.ok) {
    throw new Error("Failed to fetch library contents");
  }
  return res.json();
}

/**
 * Logs a grower interaction with a library resource.
 * @param {Object} payload - Details of the interaction.
 */
export async function logLibraryInteraction(payload) {
  const res = await fetch(`${API_BASE}/library/interaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to log interaction");
  }
  return res.json();
}

/**
 * Deletes a grower interaction with a library resource.
 * @param {Object} payload - Details of the interaction to delete.
 */
export async function deleteLibraryInteraction(payload) {
  const { content_id, farmer_id, interaction_type } = payload;
  const res = await fetch(
    `${API_BASE}/library/interaction?content_id=${content_id}&farmer_id=${farmer_id}&interaction_type=${interaction_type}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete interaction");
  }
  return res.json();
}

/**
 * Uploads a new library resource.
 * @param {Object} contentData - Library content attributes.
 * @param {string} token - Auth token.
 */
export async function uploadLibraryContent(contentData, token) {
  const res = await fetch(`${API_BASE}/library`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(contentData)
  });
  if (!res.ok) {
    throw new Error("Failed to upload library content");
  }
  return res.json();
}

/**
 * Updates an existing library resource.
 * @param {string|number} contentId - ID of the resource.
 * @param {Object} contentData - Library content attributes.
 * @param {string} token - Auth token.
 */
export async function updateLibraryContent(contentId, contentData, token) {
  const res = await fetch(`${API_BASE}/library/${contentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(contentData)
  });
  if (!res.ok) {
    throw new Error("Failed to update library content");
  }
  return res.json();
}

/**
 * Deletes a library resource.
 * @param {string|number} contentId - ID of the resource.
 * @param {string} token - Auth token.
 */
export async function deleteLibraryContent(contentId, token) {
  const res = await fetch(`${API_BASE}/library/${contentId}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!res.ok) {
    throw new Error("Failed to delete library content");
  }
  return res.json();
}
