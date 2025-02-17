<template>
  <div>
    <q-stepper v-model="step" ref="stepper" color="primary" animated>
      <q-step :name="1" title="Physiological Heat Risk" icon="settings" :done="step > 1">
        <div class="text-h4 q-mb-lg">Physiological Heat Risk</div>
        <InputFormPhysiological />
      </q-step>
      <q-step :name="2" title="Environmental Heat Risk" icon="settings" :done="step > 1">
        <div class="text-h4 q-mb-lg">Environmental Heat Risk (Australia Only)</div>
        <InputFormEnvironmental />
      </q-step>
      <q-step :name="3" title="Other Heat Risk" icon="settings" :done="step > 1">
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
              v-if="step < 3"
              class="q-mr-sm"
              flat
              color="primary"
              @click="$refs.stepper?.next()"
              label="skip"
            />
            <q-btn
              @click="$refs.stepper?.next()"
              color="primary"
              :label="step === 3 ? 'Finish' : 'Continue'"
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
import { ref } from 'vue'
import { QStepper } from 'quasar'

const step = ref(1)
const stepper = ref<QStepper | null>(null)
</script>
