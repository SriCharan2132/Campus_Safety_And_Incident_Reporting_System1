// src/components/MapView.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapView({ lat, lng, height = 300, zoom = 16 }) {
  if (!lat || !lng) {
    return (
      <div className="bg-white p-4 rounded shadow text-sm text-gray-600">
        No location provided for this incident.
      </div>
    );
  }

  const position = [Number(lat), Number(lng)];
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`;

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Incident location</h3>
        <a
          className="text-xs text-indigo-600 hover:underline"
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps
        </a>
      </div>

      <div style={{ height: height }} className="w-full rounded overflow-hidden">
        <MapContainer center={position} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              Incident location<br />
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}