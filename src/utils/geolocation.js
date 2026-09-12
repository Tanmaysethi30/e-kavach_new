/**
 * Real-world client-side geolocation & geocoding utility for E-KAVACH.
 * Queries browser GPS, client-side IP APIs, and OpenStreetMap Nominatim.
 */

// 1. Client-Side IP Geolocation (Runs in browser to get real ISP location)
export async function detectClientIpLocation() {
  const apis = [
    async () => {
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('ipwho failed');
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        return {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          city: data.city || 'Local Region',
          region: data.region || 'India',
          label: `${data.city || 'Detected Area'}, ${data.region || 'India'} (IP Synced)`,
          source: 'CLIENT_IP',
        };
      }
      throw new Error('Invalid IP payload');
    },
    async () => {
      const res = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('freeipapi failed');
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          city: data.cityName || 'Local Area',
          region: data.regionName || 'India',
          label: `${data.cityName || 'Detected Area'}, ${data.regionName || 'India'} (IP Synced)`,
          source: 'CLIENT_IP',
        };
      }
      throw new Error('Invalid IP payload');
    },
  ];

  for (const apiCall of apis) {
    try {
      const result = await apiCall();
      if (result) return result;
    } catch (e) {
      // try next
    }
  }

  return null;
}

// 2. Search City / Address using OpenStreetMap Nominatim
export async function searchLocationByQuery(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(`${query.trim()}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&limit=5`,
      {
        headers: { 'User-Agent': 'EKavach-Health-Platform/1.0' },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.map((item) => ({
        displayName: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
      }));
    }
  } catch (err) {
    console.warn('Geocoding search failed:', err.message);
  }
  return [];
}

// 3. Reverse Geocode Coordinates to human-readable address
export async function reverseGeocodeCoords(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: { 'User-Agent': 'EKavach-Health-Platform/1.0' },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.state_district || data.address.county || 'City Center';
        const suburb = data.address.suburb || data.address.neighbourhood || data.address.residential || '';
        const state = data.address.state || 'India';
        return {
          city,
          suburb,
          state,
          label: suburb ? `${suburb}, ${city}, ${state}` : `${city}, ${state}`,
        };
      }
    }
  } catch (e) {
    console.warn('Reverse geocode error:', e.message);
  }
  return null;
}
