// client/src/context/LocationContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('gng_location');
    return saved ? JSON.parse(saved) : { address: 'Tech Park, Bengaluru', lat: 12.9716, lng: 77.5946 };
  });
  
  const [isLocationSet, setIsLocationSet] = useState(() => {
    return localStorage.getItem('gng_location_set') === 'true';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestGPSLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = `📍 GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { 'Accept-Language': 'en' }
          });
          if (response.ok) {
            const data = await response.json();
            const addrObj = data.address || {};
            const place = addrObj.suburb || addrObj.neighbourhood || addrObj.residential || addrObj.town || addrObj.city;
            const region = addrObj.state || addrObj.country;
            if (place || region) {
              address = `📍 ${place ? place + ', ' : ''}${addrObj.city || region}`;
            }
          }
        } catch (err) {
          console.warn('Reverse geocoding failed, falling back to coordinates:', err);
        }

        const newLocation = {
          address,
          lat: parseFloat(latitude.toFixed(6)),
          lng: parseFloat(longitude.toFixed(6))
        };
        setLocation(newLocation);
        setIsLocationSet(true);
        localStorage.setItem('gng_location', JSON.stringify(newLocation));
        localStorage.setItem('gng_location_set', 'true');
        setLoading(false);
      },
      (err) => {
        console.warn('GPS Geolocation access denied or failed:', err);
        setError('Location permission denied. Please search or enter your city manually.');
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const setManualLocation = async (cityOrArea) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch geocoded coordinate details using Nominatim Search API
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityOrArea)}&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (!response.ok) {
        throw new Error('Failed to reach geocoding provider.');
      }
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        // Split standard long display name to keep pill labels clean and visible
        const cleanAddress = result.display_name.split(',').slice(0, 3).join(',').trim();
        const newLocation = {
          address: `📍 ${cleanAddress}`,
          lat: parseFloat(parseFloat(result.lat).toFixed(6)),
          lng: parseFloat(parseFloat(result.lon).toFixed(6))
        };
        setLocation(newLocation);
        setIsLocationSet(true);
        localStorage.setItem('gng_location', JSON.stringify(newLocation));
        localStorage.setItem('gng_location_set', 'true');
      } else {
        // Preset fallbacks for Bengaluru zones if Nominatim returns nothing
        let offsetLat = 12.9716;
        let offsetLng = 77.5946;
        if (cityOrArea.toLowerCase().includes('indiranagar')) {
          offsetLat = 12.9640;
          offsetLng = 77.6400;
        } else if (cityOrArea.toLowerCase().includes('malleswaram')) {
          offsetLat = 12.9980;
          offsetLng = 77.5700;
        } else if (cityOrArea.toLowerCase().includes('whitefield')) {
          offsetLat = 12.9698;
          offsetLng = 77.7500;
        }
        const newLocation = {
          address: `📍 ${cityOrArea}`,
          lat: offsetLat,
          lng: offsetLng
        };
        setLocation(newLocation);
        setIsLocationSet(true);
        localStorage.setItem('gng_location', JSON.stringify(newLocation));
        localStorage.setItem('gng_location_set', 'true');
      }
    } catch (err) {
      console.warn('Geocoding lookup failed, falling back:', err);
      let offsetLat = 12.9716;
      let offsetLng = 77.5946;
      const newLocation = {
        address: `📍 ${cityOrArea}`,
        lat: offsetLat,
        lng: offsetLng
      };
      setLocation(newLocation);
      setIsLocationSet(true);
      localStorage.setItem('gng_location', JSON.stringify(newLocation));
      localStorage.setItem('gng_location_set', 'true');
    } finally {
      setLoading(false);
    }
  };

  const resetLocation = () => {
    setIsLocationSet(false);
    setLocation({ address: '', lat: 0, lng: 0 });
    localStorage.removeItem('gng_location_set');
    localStorage.removeItem('gng_location');
  };

  return (
    <LocationContext.Provider value={{ location, isLocationSet, loading, error, requestGPSLocation, setManualLocation, resetLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
