const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";

/**
 * Fetches all farms belonging to a specific farmer.
 * @param {string|number} userId - The ID of the farmer.
 * @param {string} token - The auth token.
 * @returns {Promise<Array>} List of farms.
 */
export async function fetchFarms(userId, token) {
  const response = await fetch(`${API_BASE}/farms/${userId}`, {
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to fetch farms");
  }
  return response.json();
}

/**
 * Fetches activity logs for a specific farm.
 * @param {string|number} farmId - The ID of the farm.
 * @param {string} token - The auth token.
 * @returns {Promise<Array>} List of activity logs.
 */
export async function fetchLogs(farmId, token) {
  const response = await fetch(`${API_BASE}/farms/${farmId}/logs`, {
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to fetch activity logs");
  }
  return response.json();
}

/**
 * Creates a new farm partition.
 * @param {string} farmName - Name of the farm.
 * @param {string} farmLocation - Location of the farm.
 * @param {string|number} farmerId - The owner's user ID.
 * @param {string} token - The auth token.
 */
export async function createFarm(farmName, farmLocation, farmerId, token) {
  const response = await fetch(`${API_BASE}/farms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      farm_name: farmName,
      farm_location: farmLocation,
      farmer_id: parseInt(farmerId, 10)
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to create farm partition");
  }
  return response.json();
}

/**
 * Submits a new activity log.
 * @param {Object} formData - Form fields mapping to activity log.
 * @param {string} token - The auth token.
 */
export async function createActivityLog(formData, token) {
  const response = await fetch(`${API_BASE}/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      ...formData,
      farm_id: parseInt(formData.farm_id, 10),
      fertilizer_amount: parseFloat(formData.fertilizer_amount),
      temperature: parseFloat(formData.temperature),
      rainfall: parseFloat(formData.rainfall),
      soil_ph: parseFloat(formData.soil_ph)
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to save activity log");
  }
  return response.json();
}

/**
 * Updates a farm's details.
 * @param {string|number} farmId - The ID of the farm.
 * @param {Object} farmData - Object containing farm_name and farm_location.
 * @param {string} token - The auth token.
 */
export async function updateFarm(farmId, farmData, token) {
  const response = await fetch(`${API_BASE}/farms/${farmId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(farmData),
  });
  if (!response.ok) {
    throw new Error("Failed to update farm");
  }
  return response.json();
}

/**
 * Deletes a farm and all its records.
 * @param {string|number} farmId - The ID of the farm.
 * @param {string} token - The auth token.
 */
export async function deleteFarm(farmId, token) {
  const response = await fetch(`${API_BASE}/farms/${farmId}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to delete farm");
  }
  return response.json();
}

/**
 * Updates an activity log record.
 * @param {string|number} logId - The ID of the log.
 * @param {Object} logData - Form fields mapping to activity log.
 * @param {string} token - The auth token.
 */
export async function updateActivityLog(logId, logData, token) {
  const response = await fetch(`${API_BASE}/logs/${logId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      ...logData,
      fertilizer_amount: parseFloat(logData.fertilizer_amount),
      temperature: parseFloat(logData.temperature),
      rainfall: parseFloat(logData.rainfall),
      soil_ph: parseFloat(logData.soil_ph)
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to update activity log");
  }
  return response.json();
}

/**
 * Deletes an activity log record.
 * @param {string|number} logId - The ID of the log.
 * @param {string} token - The auth token.
 */
export async function deleteActivityLog(logId, token) {
  const response = await fetch(`${API_BASE}/logs/${logId}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to delete activity log");
  }
  return response.json();
}

/**
 * Fetches yield prediction analysis from backend for a specific farm.
 * @param {string|number} farmId - The ID of the farm.
 * @param {string} token - The auth token.
 */
export async function fetchYieldPrediction(farmId, token) {
  try {
    const response = await fetch(`${API_BASE}/farms/${farmId}/yield-prediction`, {
      credentials: "include"
    });
    if (!response.ok) {
      let errMsg = "Failed to fetch yield prediction analysis";
      try {
        const errData = await response.json();
        if (errData && errData.detail) {
          errMsg = errData.detail;
        }
      } catch (_) {}
      return { error: errMsg };
    }
    return response.json();
  } catch (err) {
    return { error: err.message || "Network error. Unable to connect to server." };
  }
}

/**
 * Fetches the current weather metrics for a specific farm.
 * @param {string|number} farmId - The ID of the farm.
 * @param {string} token - The auth token.
 * @returns {Promise<Object>} Object containing temperature and rainfall.
 */
export async function fetchCurrentWeather(farmId, token) {
  const response = await fetch(`${API_BASE}/farms/${farmId}/current-weather`, {
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to fetch current weather data");
  }
  return response.json();
}


