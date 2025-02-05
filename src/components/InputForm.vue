<template>
  <div>
    <div class="text-h3">1. Physiological Heat Risk</div>
    <InputFormPhysiological />
    <div class="text-h3">2. Environmental Heat Risk</div>
    <InputFormEnvironmental />
    <div class="text-h3">3. Other Heat Risk</div>
    <InputFormOther />
  </div>
</template>

<script setup lang="ts">
import InputFormPhysiological from 'src/components/InputFormPhysiological.vue'
import InputFormEnvironmental from 'src/components/InputFormEnvironmental.vue'
import InputFormOther from 'src/components/InputFormOther.vue'
</script>
