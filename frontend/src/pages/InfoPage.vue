<template>
  <q-page class="q-ma-lg">
    <div class="text-h4 q-mb-sm">Heat Risk Due to Health Conditions</div>
    You have indicated you have {{ inputParametersStore.numberOfHealthConditions }} health
    conditions and take {{ inputParametersStore.numberOfMedications }} medications that increase
    your seceptibility to heat risk. This {{ increaseRiskString }} your heat risk compared to
    someone who does not have these conditions or take these medications.
    {{
      totalConditions > 0
        ? `The below modelling is for
    someone who does not have any of these conditions or take these medications so your risk may be
    higher than what is indicated below.`
        : ''
    }}
    <div class="text-h4">Physiological Heat Risk</div>
    <div>Calculating your physiological heat risk...</div>
    <q-spinner size="xl" />
    <div class="text-h4">Environmental Heat Risk</div>
    <div>Calculating your environmental heat risk...</div>
    <q-spinner size="xl" />
  </q-page>
</template>

<script setup lang="ts">
import { useInputParametersStore } from 'src/stores/inputParameters'
import { computed } from 'vue'
const inputParametersStore = useInputParametersStore()
const totalConditions = computed(
  () => inputParametersStore.numberOfHealthConditions + inputParametersStore.numberOfMedications,
)
const increaseRiskString = computed(() => {
  if (totalConditions.value < 1) {
    return 'does not increase'
  } else if (totalConditions.value < 2) {
    return 'slightly increases'
  } else if (totalConditions.value < 3) {
    return 'increases'
  }
  return 'greatly increases'
})
</script>
