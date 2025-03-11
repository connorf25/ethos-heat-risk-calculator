<template>
  <div>
    <div class="text-h4">Environmental Heat Risk</div>
    <div v-if="isLoading">Calculating your environmental heat risk...</div>
    <q-spinner v-if="isLoading" size="xl" />

    <div v-else-if="hasError" class="text-negative">
      There was an error fetching environmental data. Please try again.
    </div>

    <div v-else-if="outputDataStore.postcode">
      <div class="q-mt-md">
        <p>
          Green space analysis for postcode: <strong>{{ outputDataStore.postcode }}</strong>
        </p>
        <p>
          Green space percentage:
          <strong>{{ outputDataStore.greenSpacePercentage?.toFixed(2) }}%</strong>
        </p>
        <p>
          Green space area: <strong>{{ formatArea(outputDataStore.greenSpaceArea) }}</strong>
        </p>
        <p>
          Total area: <strong>{{ formatArea(outputDataStore.totalArea) }}</strong>
        </p>
      </div>
      <div class="q-mt-md">
        <p>
          Areas with higher green space percentages generally have lower heat risks during extreme
          weather.
          {{ getGreenSpaceMessage() }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInputParametersStore } from 'src/stores/inputParameters'
import { useOutputDataStore } from 'src/stores/outputData'
import { ref, onMounted } from 'vue'

const inputParametersStore = useInputParametersStore()
const outputDataStore = useOutputDataStore()

const isLoading = ref(true)
const hasError = ref(false)

const formatArea = (areaInSqm: number | undefined) => {
  if (!areaInSqm) return 'N/A'
  if (areaInSqm >= 1000000) {
    return `${(areaInSqm / 1000000).toFixed(2)} sq km`
  } else if (areaInSqm >= 10000) {
    return `${(areaInSqm / 10000).toFixed(2)} hectares`
  } else {
    return `${areaInSqm.toFixed(2)} sq m`
  }
}

const getGreenSpaceMessage = () => {
  const percentage = outputDataStore.greenSpacePercentage
  if (!percentage) return ''

  if (percentage < 10) {
    return 'Your area has very limited green space, which may contribute to higher urban heat island effects.'
  } else if (percentage < 25) {
    return 'Your area has below average green space coverage, which may moderately increase heat risk.'
  } else if (percentage < 50) {
    return 'Your area has a moderate amount of green space, providing some natural cooling.'
  } else {
    return 'Your area has abundant green space, which helps reduce urban heat island effects.'
  }
}

onMounted(async () => {
  const postcode = inputParametersStore.environmental.postcode

  if (postcode) {
    isLoading.value = true
    hasError.value = false

    try {
      await outputDataStore.makePythonServerRequest(Number(postcode))
    } catch (error) {
      console.error('Failed to fetch environmental data:', error)
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
})
</script>
