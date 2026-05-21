import urllib.request
import urllib.parse
import json
import logging

logger = logging.getLogger(__name__)

# Default fallback coordinates (Perak, Malaysia)
DEFAULT_LAT = 4.1136
DEFAULT_LON = 101.2872

def query_open_meteo_geocoding(query_str: str):
    """
    Helper to query the Open-Meteo Geocoding API for a single location search string.
    """
    try:
        encoded_name = urllib.parse.quote(query_str.strip())
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_name}&count=5&language=en&format=json"
        
        req = urllib.request.Request(
            url, 
            headers={"User-Agent": "DurianSystem/1.0 (Contact: user@example.com)"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("results") or []
    except Exception as e:
        logger.error(f"Geocoding query failed for '{query_str}': {e}")
        return []

def geocode_location(location_name: str):
    """
    Geocodes a location name using the free Open-Meteo Geocoding API.
    Supports comma-separated address structures and falls back to broader geographic segments
    (with context verification) if the precise location is not found.
    Returns: (latitude: float, longitude: float)
    """
    if not location_name or not location_name.strip():
        return DEFAULT_LAT, DEFAULT_LON

    location_name = location_name.strip()
    
    # 1. Try geocoding the full name first
    results = query_open_meteo_geocoding(location_name)
    if results:
        lat = float(results[0]["latitude"])
        lon = float(results[0]["longitude"])
        logger.info(f"Geocoded full name '{location_name}' to ({lat}, {lon})")
        return lat, lon

    # 2. If it fails, split by commas and try segments with contextual verification
    parts = [p.strip() for p in location_name.split(",") if p.strip()]
    if len(parts) > 1:
        logger.info(f"Full geocoding failed for '{location_name}'. Trying segments: {parts}")
        normalized_parts = [p.lower() for p in parts]
        best_candidate = None
        
        for part in parts:
            # Skip checking extremely generic keywords (like the country) if there are other segments
            if part.lower() in ["malaysia", "singapore", "thailand", "indonesia"]:
                continue
                
            seg_results = query_open_meteo_geocoding(part)
            if seg_results:
                for r in seg_results:
                    res_admin1 = r.get("admin1", "").lower()
                    res_country = r.get("country", "").lower()
                    
                    # Verify if this result matches any of the other segments of the original address
                    has_admin_match = any(p in res_admin1 or res_admin1 in p for p in normalized_parts if p != part.lower())
                    has_country_match = any(p in res_country or res_country in p for p in normalized_parts if p != part.lower())
                    
                    if has_admin_match or has_country_match:
                        lat = float(r["latitude"])
                        lon = float(r["longitude"])
                        logger.info(f"Geocoded segment '{part}' with context match to ({lat}, {lon}) (Name: {r.get('name')}, Admin1: {r.get('admin1')}, Country: {r.get('country')})")
                        return lat, lon
                        
                    if best_candidate is None:
                        best_candidate = (float(r["latitude"]), float(r["longitude"]), r)

        if best_candidate:
            lat, lon, r = best_candidate
            logger.info(f"Using best segment candidate without strict context match: ({lat}, {lon}) (Name: {r.get('name')}, Admin1: {r.get('admin1')})")
            return lat, lon

    logger.warning(f"Geocoding failed completely for '{location_name}'. Using fallback coordinates: ({DEFAULT_LAT}, {DEFAULT_LON})")
    return DEFAULT_LAT, DEFAULT_LON


def fetch_current_weather(lat: float, lon: float):
    """
    Fetches current temperature and 24h precipitation from Open-Meteo API.
    Returns: {"temperature": float, "rainfall": float}
    """
    # Use fallback coordinates if none provided
    lat = lat if lat is not None else DEFAULT_LAT
    lon = lon if lon is not None else DEFAULT_LON

    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&daily=precipitation_sum&timezone=auto"
        req = urllib.request.Request(
            url, 
            headers={"User-Agent": "DurianSystem/1.0 (Contact: user@example.com)"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            
            current_weather = data.get("current_weather", {})
            temp = current_weather.get("temperature")
            
            # Default temperature to 28.5 if missing
            if temp is None:
                temp = 28.5
                
            daily = data.get("daily", {})
            precipitation_list = daily.get("precipitation_sum", [])
            rain = precipitation_list[0] if precipitation_list and len(precipitation_list) > 0 else 0.0
            
            # Default rain to 0.0 if missing
            if rain is None:
                rain = 0.0
                
            logger.info(f"Fetched weather for ({lat}, {lon}): temp={temp}, rain={rain}")
            return {
                "temperature": round(float(temp), 1),
                "rainfall": round(float(rain), 1)
            }
    except Exception as e:
        logger.error(f"Failed to fetch weather for ({lat}, {lon}): {e}")
        
    # Return reasonable default values if call fails
    return {
        "temperature": 28.5,
        "rainfall": 0.0
    }
