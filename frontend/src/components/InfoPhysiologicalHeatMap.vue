<template>
  <div class="heatmap-container">
    <v-chart class="chart" :option="heatmapOption" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useOutputDataStore, temperatureValues, humidityValues } from 'src/stores/outputData'

// Register ECharts components
use([CanvasRenderer, HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent])

// Access the store
const outputDataStore = useOutputDataStore()

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

  // Transform grid data to ECharts format
  const data: number[][] = []
  outputDataStore.temperatureGrid.forEach((row, i) => {
    row.forEach((value, j) => {
      data.push([j, i, value])
    })
  })

  return {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const temp = temperatureValues[params.data[0]]
        const humidity = humidityValues[params.data[1]]
        const value = params.data[2].toFixed(2)
        return `Temperature: ${temp}°C<br>Humidity: ${humidity}%<br>Rectal Temp Delta: ${value}°C`
      },
    },
    grid: {
      top: '10%',
      left: '3%',
      right: '4%',
      bottom: '15%',
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
      calculable: false, // Set to false to prevent continuous adjustment
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      type: 'piecewise', // Change to piecewise type for discrete colors
      pieces: [
        { min: 0, max: 0.8, color: '#00a854', label: '< 0.8' }, // Green for values under 0.8
        { min: 0.8, max: 1.1, color: '#faad14', label: '0.8 - 1.1' }, // Yellow for values 0.8-1.1
        { min: 1.1, max: 2, color: '#f5222d', label: '> 1.1' }, // Red for values above 1.1
      ],
      textStyle: {
        color: '#333',
      },
      showLabel: true,
    },
    series: [
      {
        name: 'Core Temperature Increase from Baseline',
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          formatter: (params: any) => params.data[2].toFixed(1),
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
