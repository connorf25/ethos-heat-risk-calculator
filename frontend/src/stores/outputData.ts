import { defineStore, acceptHMRUpdate } from 'pinia'
import { api } from 'src/boot/axios'
import { AxiosError } from 'axios'

export const useOutputDataStore = defineStore('outputData', {
  persist: true,
  state: () => ({
    postcode: undefined as undefined | number,
    greenSpacePercentage: undefined as undefined | number,
    greenSpaceArea: undefined as undefined | number,
    totalArea: undefined as undefined | number,
  }),
  actions: {
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
