"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false })

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"
import L from "leaflet"

interface Location {
  lat: number
  lng: number
}

interface Responder {
  id: string
  name: string
  type: "hospital" | "ngo" | "volunteer"
  distance: string
  lat: number
  lng: number
  available: boolean
}

interface MapContentProps {
  userLocation: Location
  responders: Responder[]
}

export default function MapContent({ userLocation, responders }: MapContentProps) {
  // Fix for default markers in Leaflet
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  }, [])

  // Create custom icons for different responder types
  const createCustomIcon = (type: string, available: boolean) => {
    const color = available ? "#10b981" : "#6b7280"
    const iconHtml = `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${type === "hospital" ? "🏥" : type === "ngo" ? "🏢" : "👥"}
      </div>
    `

    return L.divIcon({
      html: iconHtml,
      className: "custom-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }

  const userIcon = L.divIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: "user-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Location Marker */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>
          <div className="text-center">
            <div className="font-semibold">Your Location</div>
            <div className="text-sm text-gray-600">You are here</div>
          </div>
        </Popup>
      </Marker>

      {/* Responder Markers */}
      {responders.map((responder) => (
        <Marker
          key={responder.id}
          position={[responder.lat, responder.lng]}
          icon={createCustomIcon(responder.type, responder.available)}
        >
          <Popup>
            <div className="p-2">
              <div className="font-semibold text-lg">{responder.name}</div>
              <div className="text-sm text-gray-600 mb-1">{responder.distance} away</div>
              <div className="text-sm mb-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  responder.available
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {responder.available ? "Available" : "Unavailable"}
                </span>
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {responder.type}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}