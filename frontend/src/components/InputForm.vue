<template>
  <div>
    <q-stepper v-model="step" ref="stepper" color="primary" animated>
      <q-step
        :name="stepValues.physiological"
        title="Physiological Heat Risk"
        icon="settings"
        :done="inputParametersStore.isPhysiologicalComplete"
      >
        <div class="text-h4 q-mb-lg">Physiological Heat Risk</div>
        <InputFormPhysiological />
      </q-step>
      <q-step
        :name="stepValues.environmental"
        title="Environmental Heat Risk"
        icon="settings"
        :done="inputParametersStore.isEnvironmentalComplete"
      >
        <div class="text-h4 q-mb-lg">Environmental Heat Risk (Australia Only)</div>
        <InputFormEnvironmental />
      </q-step>
      <q-step
        :name="stepValues.other"
        title="Other Heat Risk"
        icon="settings"
        :done="inputParametersStore.isOtherComplete"
      >
        <div class="text-h4 q-mb-lg">Other Heat Risk</div>
        <InputFormOther />
      </q-step>
      <!-- Footer -->
      <template v-slot:navigation>
        <q-stepper-navigation>
          <div class="row items-center q-pb-none q-pt-md">
            <q-btn
              v-if="step > 1"
              flat
              color="primary"
              @click="$refs.stepper?.previous()"
              label="Back"
            />
            <q-space />
            <q-btn
              v-if="step < maxStepValue"
              class="q-mr-sm"
              flat
              color="primary"
              @click="$refs.stepper?.next()"
              label="skip"
            />
            <q-btn
              @click="step === maxStepValue ? submitForm() : $refs.stepper?.next()"
              color="primary"
              :disable="!isCurrentStepComplete"
              :label="step === maxStepValue ? 'Finish' : 'Continue'"
            />
          </div>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script setup lang="ts">
import InputFormPhysiological from 'src/components/InputFormPhysiological.vue'
import InputFormEnvironmental from 'src/components/InputFormEnvironmental.vue'
import InputFormOther from 'src/components/InputFormOther.vue'
import { computed, ref } from 'vue'
import { QStepper } from 'quasar'
import { useInputParametersStore } from 'src/stores/inputParameters'
import { useOutputDataStore } from 'src/stores/outputData'
import { useRouter } from 'vue-router'

const router = useRouter()
const inputParametersStore = useInputParametersStore()
const outputDataStore = useOutputDataStore()

const step = ref(1)
const stepper = ref<QStepper | null>(null)

const stepValues = {
  physiological: 1,
  environmental: 2,
  other: 3,
}

const maxStepValue = Math.max(...Object.values(stepValues))

const isCurrentStepComplete = computed((): boolean => {
  if (step.value === maxStepValue) {
    // Are we on the last page?
    return inputParametersStore.isAnyComplete
  } else if (step.value === stepValues.physiological) {
    return inputParametersStore.isPhysiologicalComplete
  } else if (step.value === stepValues.environmental) {
    return inputParametersStore.isEnvironmentalComplete
  } else if (step.value === stepValues.other) {
    return true
  }
  console.error('This point should not be reached, check stepValues, current step:', step.value)
  return true
})

const submitForm = async () => {
  const userPostcode = inputParametersStore.$state.environmental.postcode
  await router.push('/info')
  if (userPostcode) {
    await outputDataStore.makePythonServerRequest(userPostcode)
  }
}
</script>
