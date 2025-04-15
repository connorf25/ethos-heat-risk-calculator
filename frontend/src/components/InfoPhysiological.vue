<template>
  <div>
    <div class="text-h4 q-mb-sm">Physiological Heat Risk</div>
    <div class="q-mt-md">
      Here is an estimation of the change in your core temperature from baseline at various
      temperature/humidity combinations. The baseline core temperature is calculated based on a
      temperature of 23°C and a relative humidity of 50%. Each square represents the
      increase/decrease in your core body temperature from that baseline. Any increase above 0.8°C
      puts your body at a much higher risk of heat stress.
    </div>
    <div v-if="isLoading">
      <div>Calculating your physiological heat risk...</div>
      <q-linear-progress
        size="xl"
        :value="outputDataStore.currentStep / outputDataStore.totalSteps"
      />
    </div>
    <div v-else-if="hasError" class="text-negative">
      There was an error fetching physiological data. Please try again.
    </div>
    <div class="q-mt-md" v-else-if="outputDataStore.temperatureGrid">
      <q-card class="map-card" flat bordered>
        <q-card-section>
          <div class="text-h6">Heat Risk Matrix</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none q-mt-md relative-position">
          <InfoPhysiologicalHeatMap />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sex } from 'src/helpers/temperaturePrediction'
import { useInputParametersStore } from 'src/stores/inputParameters'
import { useOutputDataStore } from 'src/stores/outputData'
import { ref, onMounted } from 'vue'
import InfoPhysiologicalHeatMap from './InfoPhysiologicalHeatMap.vue'

const inputParametersStore = useInputParametersStore()
const outputDataStore = useOutputDataStore()

const isLoading = ref(true)
const hasError = ref(false)

onMounted(async () => {
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
    await outputDataStore.calculateRectalTemperatureGrid(biophysicalFeatures)
  } catch (error) {
    console.error('Failed to calculate physiological data:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
})
</script>
