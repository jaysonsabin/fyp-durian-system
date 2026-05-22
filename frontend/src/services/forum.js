const API_BASE = "http://localhost:8001";

/**
 * Fetches all forum posts filterable by search term and tag.
 * @param {string} searchTerm - Optional search keyword.
 * @param {string} tag - Optional category tag.
 * @returns {Promise<Array>} List of forum posts.
 */
export async function fetchForumPosts(searchTerm = "", tag = "", token = null) {
  let url = `${API_BASE}/forum/posts?`;
  if (tag) url += `tag=${encodeURIComponent(tag)}&`;
  if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
  
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch forum posts");
  }
  return res.json();
}

/**
 * Creates a new forum post.
 * @param {Object} postData - Object with title, content, tag, image_url.
 * @param {string} token - The auth token.
 */
export async function createForumPost(postData, token) {
  const res = await fetch(`${API_BASE}/forum/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(postData)
  });
  if (!res.ok) {
    throw new Error("Failed to create forum post");
  }
  return res.json();
}

/**
 * Updates a forum post.
 * @param {string|number} postId - ID of the post.
 * @param {Object} postData - Object with title, content, tag, image_url.
 * @param {string} token - The auth token.
 */
export async function updateForumPost(postId, postData, token) {
  const res = await fetch(`${API_BASE}/forum/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(postData)
  });
  if (!res.ok) {
    throw new Error("Failed to update forum post");
  }
  return res.json();
}

/**
 * Deletes a forum post.
 * @param {string|number} postId - ID of the post.
 * @param {string} token - The auth token.
 */
export async function deleteForumPost(postId, token) {
  const res = await fetch(`${API_BASE}/forum/posts/${postId}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!res.ok) {
    throw new Error("Failed to delete forum post");
  }
  return res.json();
}

/**
 * Toggles a reaction (Like) on a forum post.
 * @param {string|number} postId - ID of the post.
 * @param {string} reactionType - Type of reaction (e.g. "Like").
 * @param {string} token - The auth token.
 */
export async function toggleForumReaction(postId, reactionType, token) {
  const res = await fetch(`${API_BASE}/forum/posts/${postId}/react`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ reaction_type: reactionType })
  });
  if (!res.ok) {
    throw new Error("Failed to toggle forum reaction");
  }
  return res.json();
}

/**
 * Creates a reply for a forum post.
 * @param {string|number} postId - ID of the post.
 * @param {Object} replyData - Object with reply_content.
 * @param {string} token - The auth token.
 */
export async function createForumReply(postId, replyData, token) {
  const res = await fetch(`${API_BASE}/forum/posts/${postId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(replyData)
  });
  if (!res.ok) {
    throw new Error("Failed to create forum reply");
  }
  return res.json();
}

/**
 * Updates a forum reply.
 * @param {string|number} replyId - ID of the reply.
 * @param {Object} replyData - Object with reply_content.
 * @param {string} token - The auth token.
 */
export async function updateForumReply(replyId, replyData, token) {
  const res = await fetch(`${API_BASE}/forum/replies/${replyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(replyData)
  });
  if (!res.ok) {
    throw new Error("Failed to update forum reply");
  }
  return res.json();
}

/**
 * Deletes a forum reply.
 * @param {string|number} replyId - ID of the reply.
 * @param {string} token - The auth token.
 */
export async function deleteForumReply(replyId, token) {
  const res = await fetch(`${API_BASE}/forum/replies/${replyId}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!res.ok) {
    throw new Error("Failed to delete forum reply");
  }
  return res.json();
}

/**
 * Locks or unlocks a forum post.
 * @param {string|number} postId - ID of the post.
 * @param {string} token - The auth token.
 */
export async function lockForumPost(postId, token) {
  const res = await fetch(`${API_BASE}/forum/posts/${postId}/lock`, {
    method: "PUT",
    credentials: "include"
  });
  if (!res.ok) {
    throw new Error("Failed to lock/unlock forum post");
  }
  return res.json();
}

/**
 * Hides or unhides a forum post.
 * @param {string|number} postId - ID of the post.
 * @param {string} token - The auth token.
 */
export async function hideForumPost(postId, token) {
  const res = await fetch(`${API_BASE}/forum/posts/${postId}/hide`, {
    method: "PUT",
    credentials: "include"
  });
  if (!res.ok) {
    throw new Error("Failed to hide/unhide forum post");
  }
  return res.json();
}
