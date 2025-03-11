<template>
  <q-page class="q-ma-lg">
    <q-card class="q-pa-lg">
      <InfoOther class="q-mb-lg" />
      <InfoPhysiological class="q-my-lg" />
      <InfoEnvironmental class="q-mt-lg" />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import InfoOther from 'src/components/InfoOther.vue'
import InfoPhysiological from 'src/components/InfoPhysiological.vue'
import InfoEnvironmental from 'src/components/InfoEnvironmental.vue'
</script>
