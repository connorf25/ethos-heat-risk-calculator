import { defineStore, acceptHMRUpdate } from 'pinia'
import { api } from 'src/boot/axios'
import { AxiosError } from 'axios'
import { TemperaturePredictor, type BiophysicalFeatures } from 'src/helpers/temperaturePrediction'
import type { Geometry, FeatureCollection } from 'geojson'

export const humidityValues = Array.from({ length: 11 }, (_, i) => i * 10) // [0, 10, ..., 100]
export const temperatureValues = Array.from({ length: 12 }, (_, i) => i * 2 + 23) // [23, 25, ..., 45]

// Define a type for the expected API response structure for better type safety
interface GreenspaceApiResponse {
  postcode: string
  greenspace_percentage: number
  greenspace_area_sqm: number
  total_area_sqm: number
  postcode_geometry: Geometry
  greenspace_features: FeatureCollection
}

export const useOutputDataStore = defineStore('outputData', {
  persist: true,
  state: () => ({
    // Environmental
    postcode: undefined as undefined | number,
    greenSpacePercentage: undefined as undefined | number,
    greenSpaceArea: undefined as undefined | number,
    totalArea: undefined as undefined | number,
    postcodeGeometry: null as Geometry | null,
    greenspaceFeatures: null as FeatureCollection | null,

    // Physiological
    currentStep: 0,
    temperatureGrid: undefined as undefined | (number | null)[][],

    // Add state for potential loading/error status
    isLoading: false,
    error: null as string | null,
  }),
  getters: {
    totalSteps: () => humidityValues.length * temperatureValues.length,
    hasMapData: (state): boolean => !!state.postcodeGeometry && !!state.greenspaceFeatures,
  },
  actions: {
    // Helper action to reset state, especially before a new request
    resetGreenspaceData() {
      this.postcode = undefined
      this.greenSpacePercentage = undefined
      this.greenSpaceArea = undefined
      this.totalArea = undefined
      this.postcodeGeometry = null
      this.greenspaceFeatures = null
      this.error = null
    },

    // Calculate a 11x11 grid showing the end rectal temperature in temperature range 23-45C and humidity range 0-100%
    async calculateRectalTemperatureGrid(biophysicalFeatures: BiophysicalFeatures) {
      const temperaturePredictor = new TemperaturePredictor(biophysicalFeatures)
      this.currentStep = 0
      const rows = []
      for (const humidity of humidityValues) {
        const row = []
        for (const ambientTemp of temperatureValues) {
          this.currentStep++
          const { rectalTempDelta } = temperaturePredictor.calculateTemperatureAtConditions({
            humidity,
            ambientTemp,
          })
          row.push(rectalTempDelta)

          // Yield to the main thread every 10 calculations
          if (this.currentStep % 10 === 9) {
            await new Promise((resolve) => setTimeout(resolve, 0))
          }
        }
        rows.push(row)
      }
      this.temperatureGrid = rows
    },

    async makePythonServerRequest(postcode: number) {
      // Reset previous data and set loading state
      this.resetGreenspaceData()
      this.isLoading = true

      try {
        const url = `/api/greenspace?postcode=${postcode}`
        const response = await api.get<GreenspaceApiResponse>(url)

        this.postcode = parseInt(response.data.postcode, 10)
        this.greenSpacePercentage = response.data.greenspace_percentage
        this.greenSpaceArea = response.data.greenspace_area_sqm
        this.totalArea = response.data.total_area_sqm

        this.postcodeGeometry = response.data.postcode_geometry
        this.greenspaceFeatures = response.data.greenspace_features

        this.error = null
      } catch (error) {
        // Handle network errors or errors from the server (non-2xx status).
        this.resetGreenspaceData()

        if (error instanceof AxiosError) {
          console.error('Error fetching greenspace data:', error.message)
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Data:', error.response.data)
            console.error('Status:', error.response.status)
            this.error = `Server error: ${error.response.status}. ${error.response.data?.message || 'Please try again.'}`
          } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request)
            this.error = 'Network error: Could not reach the server.'
          } else {
            // Something happened in setting up the request that triggered an Error
            this.error = 'An unexpected error occurred while making the request.'
          }
        } else {
          console.error('Unknown error:', error)
          this.error = 'An unknown error occurred.'
        }
      } finally {
        // Always set loading to false after request finishes (success or fail)
        this.isLoading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOutputDataStore, import.meta.hot))
}
