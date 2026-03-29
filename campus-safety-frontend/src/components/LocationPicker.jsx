import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import fixLeafletIcon from "../utils/leafletIconFix";
import axiosClient from "../api/axiosClient";
fixLeafletIcon();

function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef();

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    }
  });

  return position ? (
    <Marker
      draggable
      ref={markerRef}
      position={position}
      eventHandlers={{
        dragend(e) {
          const latlng = e.target.getLatLng();
          setPosition([latlng.lat, latlng.lng]);
        }
      }}
    />
  ) : null;
}

export default function LocationPicker({
  initialPosition = null,      // [lat, lng] or null
  onChange,                   // (lat, lng, address?) => void
  height = 300,
  showSearch = true
}) {
  // local state
  const [pos, setPos] = useState(initialPosition);
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState(null);
  const mapRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // sync initialPosition (only when it actually changes)
  useEffect(() => {
    if (!initialPosition) return;
    // compare values to avoid unnecessary setState loops
    const same = pos && Math.abs(pos[0] - initialPosition[0]) < 1e-7 && Math.abs(pos[1] - initialPosition[1]) < 1e-7;
    if (!same) {
      setPos(initialPosition);
      setAddress(null); // reverse geocode will run in next effect
      if (mapRef.current) mapRef.current.flyTo(initialPosition, 16);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition]);

  // when pos changes: immediately notify parent with coords (address may arrive later),
  // then do reverse geocode via backend proxy.
  useEffect(() => {

  if (!pos) return;

  // notify parent only once
  if (onChange) {
    onChange(pos[0], pos[1], address);
  }


    (async () => {
      try {
        const res = await axiosClient.get(
  `/geocode/reverse?lat=${pos[0]}&lon=${pos[1]}`
);

let json = res.data;

if (typeof json === "string") {
  json = JSON.parse(json);
}
        const display = json.display_name || null;
        setAddress(display);
        if (onChange) onChange(pos[0], pos[1], display);
      } catch (err) {
        console.warn("Reverse geocode failed", err);
        setAddress(null);
        // coords already sent
      }
    })();
  }, [pos]);

  // search via backend proxy (debounced)
  const doSearch = async () => {
    if (!query.trim()) return;
    // simple debounce guard
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosClient.get(
  `/geocode/search?q=${encodeURIComponent(query)}`
);
        let arr = res.data;

if (typeof arr === "string") {
  arr = JSON.parse(arr);
}
        console.log("Search response:", res.data);
        if (!arr || arr.length === 0) {
          alert("Location not found");
          return;
        }
        const top = arr[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);
        setPos([lat, lon]);
        setAddress(top.display_name || null);
        if (mapRef.current) mapRef.current.flyTo([lat, lon], 17);
      } catch (err) {
        console.error(err);
        alert("Search failed");
      }
    }, 250);
  };

  const useGeolocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    // setPos(null) only if you want to show a loading state; otherwise just set
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        setPos([lat, lng]);
        if (mapRef.current) mapRef.current.flyTo([lat, lng], 16);
      },
      (err) => {
        console.warn("Geolocation failed", err);
        alert("Unable to get current location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="w-full">
      {showSearch && (
        <div className="flex gap-2 mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for place or address"
            className="border p-2 rounded flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } }}
          />
          <button type="button" onClick={doSearch} className="px-3 bg-indigo-600 text-white rounded">Search</button>
          <button type="button" onClick={useGeolocate} className="px-3 bg-gray-200 rounded">Use current</button>
        </div>
      )}

      <div style={{ height }} className="rounded overflow-hidden border">
        <MapContainer
          center={pos ?? [20.5937, 78.9629]}
          zoom={pos ? 16 : 5}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={pos} setPosition={setPos} />
        </MapContainer>
      </div>

      <div className="mt-2 text-sm">
        <div><strong>Coordinates:</strong> {pos ? `${pos[0].toFixed(6)}, ${pos[1].toFixed(6)}` : "Not set"}</div>
        <div><strong>Address:</strong> {address ?? "—"}</div>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => { if (pos && onChange) onChange(pos[0], pos[1], address); }} className="px-3 py-1 bg-green-500 text-white rounded">Use this location</button>
          <button type="button" onClick={() => { setPos(null); setAddress(null); if (onChange) onChange(null, null, null); }} className="px-3 py-1 bg-red-100 text-red-700 rounded">Clear</button>
        </div>
      </div>
    </div>
  );
}