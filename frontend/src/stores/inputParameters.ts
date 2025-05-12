// src/stores/inputParameters.ts
import { defineStore, acceptHMRUpdate } from 'pinia'

export type TimePeriod = 'morning' | 'mid-morning' | 'midday' | 'afternoon' | 'night'

export const useInputParametersStore = defineStore('inputParameters', {
  persist: true,
  state: () => ({
    physiological: {
      isFemale: undefined as undefined | boolean,
      age: undefined as undefined | number,
      isHeightCm: true,
      heightCm: undefined as undefined | number,
      heightFt: undefined as undefined | number,
      heightIn: undefined as undefined | number,
      isMassKg: true,
      massKg: undefined as undefined | number,
      massLbs: undefined as undefined | number,
    },
    environmental: {
      postcode: undefined as undefined | number,
      isAirconAvailable: undefined as undefined | boolean,
      isInsulationInstalled: undefined as undefined | boolean | null,
      isOutsideOften: undefined as undefined | boolean,
      outsideTimes: [] as TimePeriod[],
    },
    other: {
      healthConditions: [] as string[],
      medications: [] as string[],
    },
  }),
  getters: {
    isPhysiologicalComplete(state): boolean {
      return (
        state.physiological.isFemale !== undefined &&
        state.physiological.age !== undefined &&
        (!!state.physiological.heightCm ||
          (!!state.physiological.heightFt && !!state.physiological.heightIn)) &&
        (!!state.physiological.massKg || !!state.physiological.massLbs)
      )
    },
    isEnvironmentalComplete(state): boolean {
      const postcodeValid =
        state.environmental.postcode !== undefined &&
        state.environmental.postcode >= 200 &&
        state.environmental.postcode <= 9944

      const airconAnswered = state.environmental.isAirconAvailable !== undefined
      const insulationAnswered = state.environmental.isInsulationInstalled !== undefined
      const outsideOftenAnswered = state.environmental.isOutsideOften !== undefined

      let outsideTimesValid = true
      if (state.environmental.isOutsideOften === true) {
        // If they go outside often, at least one time period must be selected
        outsideTimesValid = state.environmental.outsideTimes.length > 0
      }

      return (
        postcodeValid &&
        airconAnswered &&
        insulationAnswered &&
        outsideOftenAnswered &&
        outsideTimesValid
      )
    },
    isOtherComplete(state): boolean {
      return state.other.healthConditions.length > 0 || state.other.medications.length > 0
    },
    isAnyComplete(): boolean {
      return this.isPhysiologicalComplete || this.isEnvironmentalComplete || this.isOtherComplete
    },
    numberOfHealthConditions(state): number {
      return state.other.healthConditions.length
    },
    numberOfMedications(state): number {
      return state.other.medications.length
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInputParametersStore, import.meta.hot))
}
