import React, { useState, useEffect, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ("places" | "geometry")[] = ['places', 'geometry'];
// JB Mega Mart, Fauji Foundation Road, Near Ishfaq Chowk Harbanspura, Lahore
const RESTAURANT_LOCATION = { lat: 31.5700, lng: 74.4200 };

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onError: (hasError: boolean) => void;
}

export default function LocationAutocomplete({ value, onChange, onError }: LocationAutocompleteProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("JBMM ERROR: Google Maps API Key is missing from .env file. 10km range check will not work!");
  }
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const deliveryRadius = (() => {
    const saved = localStorage.getItem('jb_store_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.deliveryRadius !== undefined ? settings.deliveryRadius : 10;
    }
    return 10;
  })();
  
  const radiusMeters = deliveryRadius * 1000;

  useEffect(() => {
    if (isLoaded && window.google && inputRef.current && !autocompleteRef.current) {
      const circle = new window.google.maps.Circle({
        center: RESTAURANT_LOCATION,
        radius: radiusMeters,
      });

      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        bounds: circle.getBounds(),
        strictBounds: false, // Use soft bounds to prioritize nearby places, hard check is done in code
        fields: ['formatted_address', 'geometry', 'name'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          // Fallback to manual validation on blur if they hit enter without clicking a valid place
          return;
        }

        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(RESTAURANT_LOCATION),
          place.geometry.location
        );
        
        if (distance > radiusMeters) {
          setErrorMsg(`Sorry, this location is outside our ${deliveryRadius}km delivery radius.`);
          onError(true);
        } else {
          setErrorMsg('');
          onError(false);
          // Auto-fill the box with the exact location string picked from the dropdown
          onChange(place.formatted_address || place.name || value);
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [isLoaded, onChange, onError, value]);

  const validateAddress = () => {
    if (!value || value.trim().length < 5) {
      setErrorMsg('Please enter a complete address.');
      onError(true);
      return;
    }

    if (!isLoaded || !window.google) {
      setErrorMsg('');
      onError(false);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    // Append city to help Google find the exact house if typed manually
    const searchQuery = value.toLowerCase().includes('lahore') ? value : `${value}, Lahore, Pakistan`;

    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(RESTAURANT_LOCATION),
          location
        );
        
        if (distance > radiusMeters) {
          setErrorMsg(`Sorry, this location is outside our ${deliveryRadius}km delivery radius.`);
          onError(true);
        } else {
          setErrorMsg('');
          onError(false);
        }
      } else {
        setErrorMsg('Could not perfectly verify this exact location on the map, but we will review it manually.');
        // Don't completely block manual addresses that are too specific (like "House 4B")
        onError(false); 
      }
    });
  };

  return (
    <div className="w-full relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={validateAddress}
        placeholder="Type your address manually (e.g. Baghbanpura, Lahore)"
        className={`w-full bg-surface-container-highest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/30 ${errorMsg ? 'ring-2 ring-primary' : ''}`}
      />
      {errorMsg && (
        <p className={`text-xs mt-2 font-bold ${errorMsg.includes('Sorry') || errorMsg.includes('Please') ? 'text-primary' : 'text-[#f39c12]'}`}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
