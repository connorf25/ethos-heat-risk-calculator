<template>
  <q-btn @click="printWithLibrary" color="positive">
    <slot>Print Component</slot>
  </q-btn>
</template>

<script setup lang="ts">
import printJS from 'print-js'

const props = defineProps<{
  targetId: string
}>()

const printWithLibrary = () => {
  printJS({
    printable: props.targetId, // ID of the element to print
    type: 'html', // Type of content
    targetStyles: ['*'], // Attempt to include all styles
    scanStyles: true, // Scan for computed styles
    documentTitle: 'Ethos', // Title for the print job/document
    header: 'Heat Risk Matrix', // Optional header text
    style: '@page { size: A4 landscape; margin: 2cm; } .chart { width: 100% !important; }', // Inject custom print CSS
    onError: (error) => console.error('Error printing:', error),
  })
}
</script>

<style scoped></style>
