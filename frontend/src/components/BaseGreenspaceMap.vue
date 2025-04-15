<template>
  <q-card class="map-card" flat bordered>
    <q-card-section>
      <div class="text-h6">Greenspace Visualization</div>
      <div v-if="!postcodeGeometry && !isLoading && !errorLoading" class="text-caption text-grey">
        Enter a postcode to see the map.
      </div>
    </q-card-section>

    <q-separator v-if="postcodeGeometry || isLoading || errorLoading" />

    <q-card-section :style="{ height: mapHeight }" class="q-pa-none relative-position">
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="absolute-center z-top text-center">
        <q-spinner-gears size="xl" color="primary" />
        <div class="q-mt-md text-primary">Loading Map Data...</div>
      </div>

      <!-- Error Message -->
      <div v-else-if="errorLoading" class="absolute-center text-center z-top">
        <q-icon name="warning" color="negative" size="lg" />
        <div class="q-mt-sm text-negative">Could not load map data. Please try again.</div>
      </div>

      <!-- Map Container -->
      <!-- Use v-show to keep the map instance alive but hidden -->
      <div
        v-show="!isLoading && !errorLoading"
        ref="mapContainer"
        style="height: 100%; width: 100%; background-color: #eee"
      >
        <l-map
          ref="mapInstance"
          v-model:zoom="zoom"
          :center="center"
          :use-global-leaflet="false"
          @ready="onMapReady"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
            attribution="© <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />

          <!-- Postcode Boundary Layer -->
          <l-geo-json
            v-if="postcodeGeometry"
            :geojson="postcodeGeometry"
            :options-style="postcodeStyleFunction"
            ref="postcodeLayer"
          ></l-geo-json>

          <!-- Greenspace Features Layer -->
          <l-geo-json
            v-if="greenspaceFeatures && greenspaceFeatures.features.length > 0"
            :geojson="greenspaceFeatures"
            :options-style="greenspaceStyleFunction"
            ref="greenspaceLayer"
          ></l-geo-json>
        </l-map>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onBeforeUnmount } from 'vue'
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LGeoJson } from '@vue-leaflet/vue-leaflet'
import type { PathOptions, PointExpression } from 'leaflet'
import type { Geometry, FeatureCollection } from 'geojson'

// --- Props ---

interface Props {
  postcodeGeometry: Geometry | null
  greenspaceFeatures: FeatureCollection | null
  isLoading?: boolean
  errorLoading?: boolean
  mapHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  postcodeGeometry: null,
  greenspaceFeatures: null,
  isLoading: false,
  errorLoading: false,
  mapHeight: '500px',
})

// --- Refs ---

const mapInstance = ref<InstanceType<typeof LMap> | null>(null)
const mapContainer = ref<HTMLElement | null>(null) // Ref for the container div
const postcodeLayer = ref<InstanceType<typeof LGeoJson> | null>(null)
const zoom = ref(5) // Start slightly more zoomed out
const center = ref<PointExpression>([-25.2744, 133.7751]) // Australia
const defaultCenter: PointExpression = [-25.2744, 133.7751]
const defaultZoom = 5
let mapReady = false // Flag to track map readiness
let resizeObserver: ResizeObserver | null = null

// --- Map Configuration ---

// Style object for postcode boundary
const postcodeStyleFunction = computed(() => {
  return (): PathOptions => ({
    fillColor: '#3388ff',
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.3,
  })
})

// Style object for greenspaces
const greenspaceStyleFunction = computed(() => {
  return (): PathOptions => ({
    fillColor: '#2b8a3e',
    weight: 2,
    opacity: 0.8,
    color: '#495057',
    fillOpacity: 0.6,
  })
})

// --- Map Logic ---

const invalidateMapSize = () => {
  if (mapInstance.value?.leafletObject) {
    console.log('Invalidating map size...')
    mapInstance.value.leafletObject.invalidateSize()
  }
}

const fitMapToBounds = () => {
  console.log('Fitting map to bounds...')
  if (
    mapInstance.value?.leafletObject &&
    postcodeLayer.value?.leafletObject &&
    props.postcodeGeometry
  ) {
    const leafletMap = mapInstance.value.leafletObject
    const postcodeLeafletLayer = postcodeLayer.value.leafletObject

    // Crucially, check if getBounds method exists and returns valid bounds
    if (typeof postcodeLeafletLayer.getBounds === 'function') {
      try {
        const bounds = postcodeLeafletLayer.getBounds()
        if (bounds && bounds.isValid()) {
          console.log('Fitting map to postcode bounds:', bounds)
          leafletMap.flyToBounds(bounds, { padding: [30, 30], maxZoom: 16 }) // Added maxZoom
        } else {
          console.warn('Postcode layer bounds are invalid. Resetting view.')
          leafletMap.flyTo(defaultCenter, defaultZoom)
        }
      } catch (e) {
        console.error('Error getting bounds or fitting map:', e)
        leafletMap.flyTo(defaultCenter, defaultZoom)
      }
    } else {
      console.warn('postcodeLayer.leafletObject does not have getBounds yet. Retrying soon...')
    }
  } else if (mapInstance.value?.leafletObject) {
    // Handle case where postcode geometry is removed
    console.log('No postcode geometry or layer not ready, resetting view.')
    mapInstance.value.leafletObject.flyTo(defaultCenter, defaultZoom)
  } else {
    console.log('Map not ready for fitting bounds yet.')
  }
}

// --- Lifecycle and Watchers ---

const onMapReady = () => {
  console.log('Leaflet map instance is ready.')
  mapReady = true
  // Invalidate size once the map object is ready, in case container size was calculated late
  void nextTick(() => {
    invalidateMapSize()
    setTimeout(() => {
      fitMapToBounds()
    }, 1000)
  })
}

watch(
  () => props.postcodeGeometry,
  (newGeometry, oldGeometry) => {
    console.log('Postcode geometry changed.')
    // Wait for the DOM update cycle AND for the map to be ready
    if (mapReady && newGeometry) {
      void nextTick(() => {
        // Add a small delay to give LGeoJson potentially more time to update its internal layer
        setTimeout(() => {
          console.log('Attempting to fit bounds after geometry change...')
          fitMapToBounds()
        }, 50)
      })
    } else if (mapReady && !newGeometry && oldGeometry) {
      // Geometry was removed, reset view
      void nextTick(() => {
        if (mapInstance.value?.leafletObject) {
          console.log('Postcode geometry removed, resetting map view.')
          mapInstance.value.leafletObject.flyTo(defaultCenter, defaultZoom)
        }
      })
    }
  },
  { deep: true }, // Deep watch might be overkill if only the top-level reference changes
)

watch(
  () => props.isLoading,
  (loading, prevLoading) => {
    if (!loading && prevLoading) {
      console.log('Loading finished.')
      void nextTick(() => {
        console.log('Invalidating map size after loading finished.')
        invalidateMapSize()
        if (props.postcodeGeometry && mapReady) {
          console.log('Re-attempting fitMapToBounds after loading finished (if needed).')
          setTimeout(fitMapToBounds, 50)
        }
      })
    }
    // Reset view if loading completes but results in an error
    if (!loading && props.errorLoading && mapInstance.value?.leafletObject) {
      console.log('Loading finished with error, resetting map view.')
      mapInstance.value.leafletObject.flyTo(defaultCenter, defaultZoom)
    }
  },
)

// --- Handle Container Resizing ---
// Use ResizeObserver to call invalidateSize if the container size changes
onMounted(() => {
  if (mapContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      console.log('Map container resized, invalidating map size.')
      invalidateMapSize()
    })
    resizeObserver.observe(mapContainer.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver && mapContainer.value) {
    resizeObserver.unobserve(mapContainer.value)
  }
  resizeObserver = null
})
</script>

<style scoped>
.map-card {
  display: flex; /* Use flexbox for better layout control */
  flex-direction: column;
  position: relative; /* Keep for absolute positioning of overlays */
}

.q-card-section:first-child {
  flex-shrink: 0; /* Prevent header from shrinking */
}

.q-card-section:last-child {
  flex-grow: 1; /* Allow map section to fill remaining space */
  min-height: 200px; /* Ensure minimum height even if mapHeight is small */
  position: relative; /* Needed for absolute positioning inside */
}

.z-top {
  z-index: 1000; /* Ensure loading/error is above map tiles */
  /* Add background to overlays to hide map content underneath */
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 4px;
}

/* Ensure map container takes full space within its parent card section */
/* The style="height: 100%; width: 100%" on the div is usually sufficient */
</style>
