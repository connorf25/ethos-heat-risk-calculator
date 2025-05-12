<template>
  <!-- Postcode Input -->
  <q-input
    v-model.number="store.environmental.postcode"
    type="number"
    label="Postcode (Australia)"
    filled
    class="q-mb-md"
    :rules="[
      (val) =>
        val === null || val === undefined || val === '' || val >= 200 || 'Postcode must be valid',
      (val) =>
        val === null || val === undefined || val === '' || val <= 9944 || 'Postcode must be valid',
    ]"
    lazy-rules
  />

  <!-- Air Conditioning -->
  <q-toggle
    v-model="store.environmental.isAirconAvailable"
    label="Do you have access to air conditioning?"
    :true-value="true"
    :false-value="false"
    class="q-mb-md full-width-toggle"
  />

  <!-- Insulation -->
  <q-toggle
    v-model="store.environmental.isInsulationInstalled"
    label="Does your home have insulation?"
    :true-value="true"
    :false-value="false"
    toggle-indeterminate
    :indeterminate-value="null"
    class="q-mb-md full-width-toggle"
  />

  <!-- Go Outside Often -->
  <q-toggle
    v-model="store.environmental.isOutsideOften"
    label="Do you go outside often?"
    :true-value="true"
    :false-value="false"
    class="q-mb-md full-width-toggle"
  />

  <!-- Time Outside (Conditional, Multiple Selections) -->
  <q-select
    v-if="store.environmental.isOutsideOften === true"
    v-model="store.environmental.outsideTimes"
    :options="timeOutsideOptions"
    label="What time(s) do you typically go outside?"
    filled
    multiple
    emit-value
    map-options
    use-chips
    clearable
    class="q-mb-md"
    :rules="[
      (val) =>
        store.environmental.isOutsideOften === true
          ? (val && val.length > 0) || 'Please select at least one time period'
          : true,
    ]"
    lazy-rules
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useInputParametersStore, type TimePeriod } from 'src/stores/inputParameters' // Adjust path if necessary

const store = useInputParametersStore()

// Options now explicitly typed for clarity, matching the store type
const timeOutsideOptions = ref<Array<{ label: string; value: TimePeriod }>>([
  { label: 'Morning (12am-6am)', value: 'morning' },
  { label: 'Mid-morning (6am-10am)', value: 'mid-morning' },
  { label: 'Midday (10am-3pm)', value: 'midday' },
  { label: 'Afternoon (3pm-6pm)', value: 'afternoon' },
  { label: 'Night (6pm-12am)', value: 'night' },
])

// Watch for changes in 'isOutsideOften'
// If the user unchecks "Do you go outside often?", reset the outsideTimes array.
watch(
  () => store.environmental.isOutsideOften,
  (isGoingOut) => {
    if (isGoingOut === false) {
      store.environmental.outsideTimes = [] // Reset to an empty array
    }
  },
)
</script>

<style scoped>
.full-width-toggle .q-toggle__label {
  width: 100%;
}
.q-toggle {
  width: 100%;
  margin-bottom: 16px; /* q-mb-md */
}
.q-select,
.q-input {
  margin-bottom: 16px; /* q-mb-md */
}
</style>
