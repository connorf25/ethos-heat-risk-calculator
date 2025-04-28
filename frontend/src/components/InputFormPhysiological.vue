<template>
  <q-form class="q-gutter-md">
    <!-- Sex Selection -->
    <q-field label="Sex" stack-label>
      <template v-slot:control>
        <div class="q-gutter-sm">
          <q-radio v-model="store.physiological.isFemale" :val="false" label="Male" />
          <q-radio v-model="store.physiological.isFemale" :val="true" label="Female" />
        </div>
      </template>
    </q-field>

    <!-- Age Input -->
    <q-input
      v-model.number="store.physiological.age"
      type="number"
      label="Age (years)"
      suffix="years"
      :rules="[
        (val) => val === null || val === undefined || val >= 0 || 'Age must be positive',
        (val) => val === null || val === undefined || val <= 120 || 'Age must be realistic',
      ]"
    />

    <!-- Height Input -->
    <div class="row q-mb-md">
      <div v-if="store.physiological.isHeightCm" class="col-xs-8 col-sm-10 q-pr-lg">
        <q-input
          v-model.number="store.physiological.heightCm"
          type="number"
          label="Height (cm)"
          suffix="cm"
          :rules="[
            (val) => val === null || val === undefined || val >= 0 || 'Height must be positive',
            (val) => val === null || val === undefined || val <= 300 || 'Height must be realistic',
          ]"
        >
        </q-input>
      </div>

      <div v-else class="col-10 row q-pr-lg">
        <q-input
          v-model.number="store.physiological.heightFt"
          type="number"
          label="Height (ft)"
          suffix="ft"
          class="col q-mr-md"
          :rules="[
            (val) => val === null || val === undefined || val >= 0 || 'Height must be positive',
            (val) => val === null || val === undefined || val <= 9 || 'Height must be realistic',
          ]"
        />
        <q-input
          v-model.number="store.physiological.heightIn"
          type="number"
          label="Height (in)"
          suffix="in"
          class="col"
          :rules="[
            (val) => val === null || val === undefined || val >= 0 || 'Inches must be positive',
            (val) => val === null || val === undefined || val < 12 || 'Inches must be less than 12',
          ]"
        >
        </q-input>
      </div>
      <div class="col">
        <q-btn-toggle
          v-model="store.physiological.isHeightCm"
          toggle-color="primary"
          :options="[
            { label: 'cm', value: true },
            { label: 'ft', value: false },
          ]"
        />
      </div>
    </div>

    <!-- Mass Input -->
    <div class="q-mb-md row">
      <div class="col-xs-8 col-sm-10 q-pr-lg">
        <q-input
          v-model.number="store.physiological.massKg"
          v-if="store.physiological.isMassKg"
          type="number"
          label="Mass (kg)"
          suffix="kg"
          :rules="[
            (val) => val === null || val === undefined || val >= 0 || 'Mass must be positive',
            (val) => val === null || val === undefined || val <= 500 || 'Mass must be realistic',
          ]"
        />
        <q-input
          v-model.number="store.physiological.massLbs"
          v-else
          type="number"
          label="Mass (lbs)"
          suffix="lbs"
          :rules="[
            (val) => val === null || val === undefined || val >= 0 || 'Mass must be positive',
            (val) => val === null || val === undefined || val <= 1100 || 'Mass must be realistic',
          ]"
        />
      </div>
      <div class="col">
        <q-btn-toggle
          v-model="store.physiological.isMassKg"
          toggle-color="primary"
          :options="[
            { label: 'kg', value: true },
            { label: 'lbs', value: false },
          ]"
        />
      </div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { useInputParametersStore } from 'src/stores/inputParameters'
import { watch } from 'vue'

const store = useInputParametersStore()

// Watch for changes in ft/in and update cm
watch([() => store.physiological.heightFt, () => store.physiological.heightIn], ([ft, inches]) => {
  if (!store.physiological.isHeightCm && ft !== undefined && inches !== undefined) {
    store.physiological.heightCm = Math.round((ft * 30.48 + inches * 2.54) * 10) / 10
  }
})

// Watch for changes in cm and update ft/in
watch(
  () => store.physiological.heightCm,
  (cm) => {
    if (store.physiological.isHeightCm && cm !== undefined) {
      const totalInches = cm / 2.54
      store.physiological.heightFt = Math.floor(totalInches / 12)
      store.physiological.heightIn = Math.round((totalInches % 12) * 10) / 10
    }
  },
)

// Watch for changes in kg and update lbs
watch(
  () => store.physiological.massKg,
  (kg) => {
    if (store.physiological.isMassKg && kg !== undefined) {
      store.physiological.massLbs = Math.round(kg * 2.20462 * 10) / 10
    }
  },
)

// Watch for changes in lbs and update kg
watch(
  () => store.physiological.massLbs,
  (lbs) => {
    if (!store.physiological.isMassKg && lbs !== undefined) {
      store.physiological.massKg = Math.round((lbs / 2.20462) * 10) / 10
    }
  },
)
</script>
