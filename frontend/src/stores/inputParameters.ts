import { defineStore, acceptHMRUpdate } from 'pinia'

export const useInputParametersStore = defineStore('inputParameters', {
  persist: true,
  state: () => ({
    physiological: {
      isFemale: undefined as undefined | boolean,
      age: undefined as undefined | number,
      // Height
      isHeightCm: true,
      heightCm: undefined as undefined | number,
      heightFt: undefined as undefined | number,
      heightIn: undefined as undefined | number,
      // Mass
      isMassKg: true,
      massKg: undefined as undefined | number,
      massLbs: undefined as undefined | number,
    },
    environmental: {
      postcode: undefined as undefined | number,
      isAirconAvailable: undefined as undefined | boolean,
      isInsulationInstalled: undefined as undefined | boolean | null,
      isOutsideOften: undefined as undefined | boolean,
      outsideTimes: [] as ('morning' | 'midday' | 'evening' | 'night')[],
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
      return (
        state.environmental.postcode !== undefined &&
        state.environmental.postcode >= 200 &&
        state.environmental.postcode <= 9944
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
