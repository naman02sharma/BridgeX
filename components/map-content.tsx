"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

interface Location {
  lat: number
  lng: number
}

interface Responder {
  id: string
  name: string
  type: string
  distance: string
  lat: number
  lng: number
  available: boolean
  phone?: string
  address?: string
}

interface MapContentProps {
  userLocation: Location
  responders: Responder[]
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom())
    }
  }, [lat, lng, map])
  return null
}

export default function MapContent({ userLocation, responders }: MapContentProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })
    }
  }, [])

  // Create custom icons for different emergency facility / responder types
  const createCustomIcon = (type: string, available: boolean) => {
    let color = "#ef4444" // red
    let emoji = "🚨"

    if (type === "hospital" || type === "medical") {
      color = "#10b981" // green
      emoji = "🏥"
    } else if (type === "fire_station" || type === "fire") {
      color = "#f97316" // orange
      emoji = "🚒"
    } else if (type === "police" || type === "security") {
      color = "#3b82f6" // blue
      emoji = "🚓"
    } else if (type === "clinic" || type === "doctors") {
      color = "#06b6d4" // cyan
      emoji = "⚕️"
    } else if (type === "pharmacy") {
      color = "#8b5cf6" // purple
      emoji = "💊"
    } else if (type === "ngo") {
      color = "#d946ef" // fuchsia
      emoji = "🤝"
    } else if (type === "volunteer") {
      color = "#eab308" // yellow
      emoji = "👥"
    }

    const iconHtml = `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        font-size: 14px;
      ">
        ${emoji}
      </div>
    `

    return L.divIcon({
      html: iconHtml,
      className: "custom-facility-marker",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }

  const userIcon = L.divIcon({
    html: `
      <div style="
        background-color: #2563eb;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(37,99,235,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    className: "user-location-marker",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Location Marker */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>
          <div className="p-1 text-center">
            <div className="font-bold text-sm text-blue-600">📍 You are here</div>
            <div className="text-xs text-gray-500 mt-1">
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Facility & Responder Markers */}
      {responders.map((responder) => (
        <Marker
          key={responder.id}
          position={[responder.lat, responder.lng]}
          icon={createCustomIcon(responder.type, responder.available)}
        >
          <Popup>
            <div className="p-2 min-w-[180px]">
              <div className="font-bold text-sm">{responder.name}</div>
              <div className="text-xs text-blue-600 font-medium mt-0.5">{responder.distance} away</div>
              {responder.address && (
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{responder.address}</div>
              )}
              {responder.phone && (
                <div className="text-xs text-gray-700 mt-1 font-mono">📞 {responder.phone}</div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                  {responder.type.replace("_", " ")}
                </span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${responder.lat},${responder.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Directions →
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
