<template>
  <div class="text-h6">Select any of the below health conditions that may influence heat risk</div>
  <q-option-group
    :options="healthConditions"
    type="checkbox"
    v-model="store.other.healthConditions"
  />

  <div class="text-h6 q-mt-lg">
    Select any of the below medications you take that may influence heat risk
  </div>
  <q-option-group :options="medications" type="checkbox" v-model="store.other.medications" />
</template>

<script setup lang="ts">
import { useInputParametersStore } from 'src/stores/inputParameters'

const store = useInputParametersStore()

const healthConditions = [
  { label: 'Cardiovascular Diseases', value: 'cardio_dis' },
  { label: 'Heart Failure', value: 'heart_fail' },
  { label: 'Coronary Artery Disease', value: 'coronary_art_dis' },
  { label: 'Hypertension (High Blood Pressure)', value: 'hypertension' },
  { label: 'Respiratory Diseases', value: 'resp_dis' },
  { label: 'Asthma', value: 'asthma' },
  { label: 'Chronic Obstructive Pulmonary Disease (COPD)', value: 'copd' },
  { label: 'Kidney Disease', value: 'kidney_dis' },
  { label: 'Chronic Kidney Disease', value: 'chronic_kidney_dis' },
  { label: 'Diabetes', value: 'diabetes' },
  { label: 'Type 1 and Type 2 Diabetes', value: 'type1_2_diabetes' },
  { label: 'Neurological Conditions', value: 'neuro_cond' },
  { label: 'Multiple Sclerosis (MS)', value: 'ms' },
  { label: "Parkinson's Disease", value: 'parkinsons' },
  { label: 'Dementia', value: 'dementia' },
  { label: 'Mental Health Conditions', value: 'mental_health_cond' },
  { label: 'Schizophrenia', value: 'schizophrenia' },
  { label: 'Severe Depression or Anxiety', value: 'severe_dep_anx' },
  { label: 'Obesity', value: 'obesity' },
  { label: 'Sickle Cell Disease', value: 'sickle_cell' },
  { label: 'Cystic Fibrosis', value: 'cystic_fibrosis' },
  { label: 'Thyroid disorders', value: 'thyroid_dis' },
]

const medications = [
  { label: 'Diuretics (water pills)', value: 'diuretics' },
  { label: 'Antihistamines', value: 'antihistamines' },
  { label: 'Antidepressants', value: 'antidepressants' },
  { label: 'Antipsychotics', value: 'antipsychotics' },
  { label: 'Beta-blockers', value: 'beta_blockers' },
  { label: "Medications for Parkinson's disease", value: 'parkinsons_meds' },
]
</script>
