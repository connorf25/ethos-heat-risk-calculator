import { defineStore, acceptHMRUpdate } from 'pinia'

export const useInputParametersStore = defineStore('inputParameters', {
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
      address: '',
    },
    other: {
      healthConditions: [] as string[],
      medications: [] as string[],
    },
  }),
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInputParametersStore, import.meta.hot))
}
