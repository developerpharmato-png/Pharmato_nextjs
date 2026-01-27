"use client";
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import TextField from "@mui/material/TextField";

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface StoreMapComponentProps {
  gpsValue: string; // "lat,lng" format
  addressValue?: string; // Google/OSM address string
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect?: (address: string) => void;
  disabled?: boolean;
}

// Component to update map center programmatically
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

// Component to handle map clicks
function LocationMarker({
  position,
  setPosition,
  onLocationSelect,
  disabled,
  onMapClick,
}: {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
  onLocationSelect: (lat: number, lng: number) => void;
  disabled: boolean;
  onMapClick?: () => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.();
      if (!disabled) {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>
        Selected Location
        <br />
        Lat: {position[0].toFixed(6)}
        <br />
        Lng: {position[1].toFixed(6)}
      </Popup>
    </Marker>
  ) : null;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const StoreMapComponent: React.FC<StoreMapComponentProps> = ({
  gpsValue,
  addressValue = "",
  onLocationSelect,
  onAddressSelect,
  disabled = false,
}) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
  const [searchAddress, setSearchAddress] = useState(addressValue);
  const [searchError, setSearchError] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gpsValue && gpsValue.includes(",")) {
      const [lat, lng] = gpsValue.split(",").map((val) => parseFloat(val.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        const newPos: [number, number] = [lat, lng];
        setPosition(newPos);
        setMapCenter(newPos);
      }
    }
  }, [gpsValue]);

  // Update search address when addressValue prop changes
  useEffect(() => {
    if (addressValue) {
      setSearchAddress(addressValue);
    }
  }, [addressValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    if (searchAddress.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchAddress
          )}&limit=5`
        );
        const data = await response.json();
        console.log("Suggestions fetched:", data); // Debug log
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchAddress]);

  const handleLocationSelect = (lat: number, lng: number) => {
    onLocationSelect(lat, lng);
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const newPos: [number, number] = [lat, lng];
    setPosition(newPos);
    setMapCenter(newPos);
    handleLocationSelect(lat, lng);
    setSearchAddress(suggestion.display_name);
    onAddressSelect?.(suggestion.display_name); // Update GoogleAddress field
    setShowSuggestions(false);
    setSearchError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && suggestions.length > 0) {
      e.preventDefault();
      selectSuggestion(suggestions[0]); // Select first suggestion on Enter
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-4">
      {/* Address Search Input */}
      <div className="flex-1 mb-4 md:mb-0 relative" ref={searchContainerRef}>
        <TextField
          fullWidth
          label="Select Store Location on Map *"
          placeholder="Start typing to see suggestions..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          disabled={disabled}
          variant="outlined"
          size="small"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
            style={{ zIndex: 9999 }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <p className="text-sm text-gray-800">{suggestion.display_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {searchError && (
        <p className="text-sm text-red-600 mb-2">{searchError}</p>
      )}

      <div className="flex-1 h-[200px] rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={mapCenter}
          zoom={position ? 15 : 5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={!disabled}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterUpdater center={mapCenter} />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationSelect={handleLocationSelect}
            disabled={disabled}
            onMapClick={() => setShowSuggestions(false)}
          />
        </MapContainer>
      </div>
     
    </div>
  );
};

export default StoreMapComponent;
