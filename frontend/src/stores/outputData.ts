import { defineStore, acceptHMRUpdate } from 'pinia'
import { api } from 'src/boot/axios'
import { AxiosError } from 'axios'
import { TemperaturePredictor, type BiophysicalFeatures } from 'src/helpers/temperaturePrediction'

export const humidityValues = Array.from({ length: 11 }, (_, i) => i * 10) // [0, 10, ..., 100]
export const temperatureValues = Array.from({ length: 12 }, (_, i) => i * 2 + 23) // [23, 25, ..., 45]

export const useOutputDataStore = defineStore('outputData', {
  persist: true,
  state: () => ({
    // Environmental
    postcode: undefined as undefined | number,
    greenSpacePercentage: undefined as undefined | number,
    greenSpaceArea: undefined as undefined | number,
    totalArea: undefined as undefined | number,
    // Physiological
    currentStep: 0,
    temperatureGrid: undefined as undefined | number[][],
  }),
  getters: {
    totalSteps: () => humidityValues.length * temperatureValues.length,
  },
  actions: {
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
      try {
        // Construct the URL with the postcode as a query parameter.
        const url = `/api/greenspace?postcode=${postcode}`

        // Make the GET request using axios.  We assume the server is running on the same host.
        const response = await api.get(url)

        // Check for successful response (status code 200-299).
        if (response.status >= 200 && response.status < 300) {
          // Update the store state with the data from the response.
          this.postcode = parseInt(response.data.postcode) // Ensure correct type
          this.greenSpacePercentage = response.data.greenspace_percentage
          this.greenSpaceArea = response.data.greenspace_area_sqm
          this.totalArea = response.data.total_area_sqm
        } else {
          // Handle non-successful responses (e.g., 400, 500).
          console.error('Server error:', response.status, response.data)
          // You could throw an error, or set an error state in the store.
          throw new Error(`Server responded with status: ${response.status}`)
        }
      } catch (error) {
        // Handle network errors, or errors thrown from the 'else' block above.
        if (error instanceof AxiosError) {
          console.error('Error fetching data:', error.message)
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Data:', error.response.data)
            console.error('Status:', error.response.status)
            console.error('Headers:', error.response.headers)
          } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request)
          }
        } else {
          console.error('Unknown error:', error)
        }
        throw error // Re-throw the error so calling functions can handle it.
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOutputDataStore, import.meta.hot))
}
