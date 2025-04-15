<template>
  <div id="heatmap-container" class="heatmap-container">
    <v-chart class="chart" :option="heatmapOption" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  GraphicComponent, // Import GraphicComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useOutputDataStore, temperatureValues, humidityValues } from 'src/stores/outputData'

// Register ECharts components
use([
  CanvasRenderer,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  GraphicComponent, // Register GraphicComponent
])

// Access the store
const outputDataStore = useOutputDataStore()

// Define a special value for null/vapour pressure limit exceeded
const VAPOUR_PRESSURE_LIMIT_VALUE = 999

// Computed option for the heatmap
const heatmapOption = computed(() => {
  if (!outputDataStore.temperatureGrid) {
    return {
      title: {
        text: 'No data available',
        left: 'center',
        top: 'center',
      },
    }
  }

  // Transform grid data to ECharts format, replacing null with the special value for vapour pressure limit
  const data: (number | null)[][] = []
  outputDataStore.temperatureGrid.forEach((row, i) => {
    row.forEach((value, j) => {
      // Push [xIndex, yIndex, valueOrSpecialValue]
      data.push([j, i, value === null ? VAPOUR_PRESSURE_LIMIT_VALUE : value])
    })
  })

  return {
    tooltip: {
      position: 'top',
      formatter: (params: { data: [number, number, number] }) => {
        const temp = temperatureValues[params.data[0]]
        const humidity = humidityValues[params.data[1]]
        const value = params.data[2]

        if (value === VAPOUR_PRESSURE_LIMIT_VALUE) {
          return `Temperature: ${temp}°C<br>Humidity: ${humidity}%<br>Exceeding vapour pressure limit`
        } else {
          const coreTemp = value.toFixed(2)
          return `Temperature: ${temp}°C<br>Humidity: ${humidity}%<br>Increase in core body temperature from baseline: ${coreTemp}°C`
        }
      },
    },
    grid: {
      top: '0%',
      left: '3%',
      right: '4%',
      bottom: '30%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: temperatureValues,
      name: 'Temperature (°C)',
      nameLocation: 'middle',
      nameGap: 30,
      splitArea: {
        show: true,
      },
    },
    yAxis: {
      type: 'category',
      data: humidityValues,
      name: 'Humidity (%)',
      nameLocation: 'middle',
      nameGap: 30,
      splitArea: {
        show: true,
      },
    },
    visualMap: {
      min: 0,
      max: 2,
      calculable: false,
      orient: 'vertical',
      left: 'center',
      pieces: [
        // Add piece for the special value (null/vapour pressure limit)
        {
          value: VAPOUR_PRESSURE_LIMIT_VALUE, // Exact value match
          color: '#000000', // Black color
          label: 'Exceeding vapour pressure limit', // Legend label
        },
        // Original risk level pieces
        { min: -10, max: 0.8, color: '#00a854', label: 'Low risk (< 0.8°C)' }, // Green
        { min: 0.8, max: 1.1, color: '#faad14', label: 'Medium risk (0.8-1.1°C)' }, // Yellow
        { min: 1.1, max: 10, color: '#f5222d', label: 'High risk (> 1.1°C)' }, // Red - adjusted max slightly just in case
      ],
      textStyle: {
        color: '#333',
      },
    },
    // Add graphic component for the legend title
    graphic: {
      elements: [
        {
          type: 'text',
          left: 'center',
          bottom: '20%',
          style: {
            text: 'Estimated risk level',
            textAlign: 'center',
            fill: '#333',
            fontWeight: 'bold',
          },
        },
      ],
    },
    series: [
      {
        name: 'Core Temperature Increase from Baseline',
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          // Only show label for valid temperature values, not for the special value
          formatter: (params: { data: [number, number, number] }) => {
            const value = params.data[2]
            return value !== VAPOUR_PRESSURE_LIMIT_VALUE ? value.toFixed(1) : '' // Show empty string for black cells
          },
          // Optional: Change text color for better contrast on different backgrounds
          // color: '#fff' // Example: White text
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }
})
</script>

<style scoped>
.heatmap-container {
  width: 100%;
  height: 500px;
}
.chart {
  width: 100%;
  height: 100%;
}
</style>
