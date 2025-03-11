<template>
  <div>
    <div class="text-h4 q-mb-sm">Physiological Heat Risk</div>
    <div v-if="isLoading">
      <div>Calculating your physiological heat risk...</div>
      <q-spinner size="xl" :value="outputDataStore.currentStep / outputDataStore.totalSteps" />
    </div>
    <div v-else-if="hasError" class="text-negative">
      There was an error fetching physiological data. Please try again.
    </div>
    <div v-else-if="outputDataStore.temperatureGrid">
      {{ outputDataStore.temperatureGrid }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sex } from 'src/helpers/temperaturePrediction'
import { useInputParametersStore } from 'src/stores/inputParameters'
import { useOutputDataStore } from 'src/stores/outputData'
import { ref, onMounted } from 'vue'

const inputParametersStore = useInputParametersStore()
const outputDataStore = useOutputDataStore()

const isLoading = ref(true)
const hasError = ref(false)

onMounted(() => {
  if (
    inputParametersStore.physiological.isFemale === undefined ||
    inputParametersStore.physiological.age === undefined ||
    inputParametersStore.physiological.heightCm === undefined ||
    inputParametersStore.physiological.massKg === undefined
  ) {
    return
  }

  const biophysicalFeatures = {
    sex: inputParametersStore.physiological.isFemale ? Sex.FEMALE : Sex.MALE,
    age: inputParametersStore.physiological.age,
    heightCm: inputParametersStore.physiological.heightCm,
    massKg: inputParametersStore.physiological.massKg,
  }

  isLoading.value = true
  hasError.value = false

  try {
    outputDataStore.calculateRectalTemperatureGrid(biophysicalFeatures)
  } catch (error) {
    console.error('Failed to calculate physiological data:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
})
</script>
