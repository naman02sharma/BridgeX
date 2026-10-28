"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Phone, Globe as GlobeIcon, Clock, AlertTriangle, Loader2 } from "lucide-react"
import { 
  getNearbyEmergencyResources, 
  formatDistance, 
  getCategoryIcon, 
  getCategoryColor,
  type NearbyPlace 
} from "@/lib/geolocation-service"
import { useGlobalTranslation } from "./translation-provider"
import { motion, AnimatePresence } from "framer-motion"

interface NearbyEmergencyResourcesProps {
  radiusMeters?: number
  maxResults?: number
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function NearbyEmergencyResources({
  radiusMeters: initialRadius = 20000,
  maxResults = 15,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
}: NearbyEmergencyResourcesProps) {
  const { t } = useGlobalTranslation()
  const [radiusMeters, setRadiusMeters] = useState<number>(initialRadius)
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getNearbyEmergencyResources(radiusMeters)
      
      if (!result.success) {
        setError(result.error || 'Failed to fetch nearby resources')
        setPlaces([])
        setUserLocation(result.userLocation)
        return
      }

      setPlaces(result.places)
      setUserLocation(result.userLocation)
    } catch (err) {
      console.warn('Error fetching resources:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()

    if (autoRefresh) {
      const interval = setInterval(fetchResources, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [radiusMeters, autoRefresh, refreshInterval])

  const filteredPlaces = selectedCategory === 'all' 
    ? places 
    : places.filter(place => place.category === selectedCategory)

  const displayPlaces = filteredPlaces.slice(0, maxResults)

  const categories = [
    { value: 'all', label: t('all', 'All'), count: places.length },
    { value: 'hospital', label: t('hospitals', 'Hospitals'), count: places.filter(p => p.category === 'hospital').length },
    { value: 'clinic', label: t('clinics', 'Clinics'), count: places.filter(p => p.category === 'clinic').length },
    { value: 'pharmacy', label: t('pharmacies', 'Pharmacies'), count: places.filter(p => p.category === 'pharmacy').length },
    { value: 'police', label: t('police', 'Police'), count: places.filter(p => p.category === 'police').length },
    { value: 'fire_station', label: t('fireStations', 'Fire Stations'), count: places.filter(p => p.category === 'fire_station').length },
    { value: 'ngo', label: t('ngos', 'NGOs'), count: places.filter(p => p.category === 'ngo').length },
  ].filter(cat => cat.value === 'all' || cat.count > 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('nearbyResources', 'Nearby Emergency Resources')}
          </CardTitle>
          <CardDescription>{t('loadingNearbyPlaces', 'Loading nearby places...')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-orange-500/20 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="w-5 h-5" />
            {userLocation
              ? t('placesError', "Couldn't load nearby places")
              : t('locationError', 'Location Error')}
          </CardTitle>
          <CardDescription className="text-orange-600/80 dark:text-orange-400/80">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {userLocation
                ? t('placesErrorDesc', 'The map data service is busy. Your location is fine, please retry in a few seconds.')
                : t('locationErrorDesc', 'Please enable location access in your browser settings to view nearby emergency resources.')}
            </p>
            <Button onClick={fetchResources} variant="outline" className="w-full">
              <Navigation className="w-4 h-4 mr-2" />
              {userLocation ? t('refresh', 'Retry') : t('retryLocation', 'Retry Location Access')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (places.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('nearbyResources', 'Nearby Emergency Resources')}
          </CardTitle>
          <CardDescription>{t('noPlacesFound', 'No emergency resources found nearby')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('noPlacesDesc', 'Try increasing the search radius or check your location settings.')}
          </p>
          <Button onClick={fetchResources} variant="outline" className="w-full">
            <Navigation className="w-4 h-4 mr-2" />
            {t('refresh', 'Refresh')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t('nearbyResources', 'Nearby Emergency Resources')}
          </CardTitle>
          {/* Geolocation Range Toggle (15-20 km) */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs">
            {[10000, 15000, 20000].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusMeters(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  radiusMeters === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r / 1000}km
              </button>
            ))}
          </div>
        </div>
        <CardDescription>
          {t('foundPlaces', 'Found')} {places.length} {t('placesNearby', 'places nearby within')} {radiusMeters / 1000} km
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Places List */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {displayPlaces.map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-3xl flex-shrink-0">
                        {getCategoryIcon(place.category)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm line-clamp-1">{place.name}</h4>
                          {place.distance && (
                            <span className="text-xs font-medium text-primary flex-shrink-0">
                              {formatDistance(place.distance)}
                            </span>
                          )}
                        </div>

                        <p className={`text-xs font-medium mb-2 ${getCategoryColor(place.category)}`}>
                          {place.category.replace('_', ' ').toUpperCase()}
                          {place.emergency && (
                            <span className="ml-2 text-red-600 dark:text-red-400">• 24/7 EMERGENCY</span>
                          )}
                        </p>

                        {place.address && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            📍 {place.address}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {place.phone && (
                            <a
                              href={`tel:${place.phone}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              {place.phone}
                            </a>
                          )}
                          {place.website && (
                            <a
                              href={place.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <GlobeIcon className="w-3 h-3" />
                              {t('website', 'Website')}
                            </a>
                          )}
                          {place.openingHours && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {place.openingHours}
                            </span>
                          )}
                        </div>

                        {/* Navigate Button */}
                        {userLocation && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full text-xs"
                            onClick={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${place.lat},${place.lon}`
                              window.open(url, '_blank')
                            }}
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            {t('navigate', 'Navigate')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Refresh Button */}
        <Button
          onClick={fetchResources}
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('loading', 'Loading...')}
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              {t('refresh', 'Refresh')}
            </>
          )}
        </Button>

        {filteredPlaces.length > maxResults && (
          <p className="text-xs text-center text-muted-foreground">
            {t('showingResults', 'Showing')} {maxResults} {t('of', 'of')} {filteredPlaces.length} {t('results', 'results')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
