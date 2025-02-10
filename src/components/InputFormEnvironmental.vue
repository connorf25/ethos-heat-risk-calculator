<template>
  <!-- Postcode Input -->
  <q-input
    v-model.number="store.environmental.postcode"
    type="number"
    label="Postcode (Australia)"
    :rules="[
      (val) => val === null || val === undefined || val >= 200 || 'Postcode must be valid',
      (val) => val === null || val === undefined || val <= 9944 || 'Postcode must be valid',
    ]"
  />
</template>

<script setup lang="ts">
import { useInputParametersStore } from 'src/stores/inputParameters'

const store = useInputParametersStore()
</script>
