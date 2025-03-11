// scaler.ts

interface MinMaxScalerParams {
  min: number[] // the min_ attribute taken from sklearn.preprocessing.MinMaxScaler
  scale: number[] // the scale_ attribute taken from sklearn.preprocessing.MinMaxScaler
}

// TODO: Placeholder - Replace with values from final trained model
export const featuresScalerParams: MinMaxScalerParams = {
  min: [
    0.0, -0.3114754098360656, -3.020833333333333, -0.6183587248751761, -1.222222222222222,
    -0.21951219512195122, -11.197107405358395, -2.105553500973682,
  ],
  scale: [
    1.0, 0.01639344262295082, 0.020833333333333332, 0.012802458071949815, 0.05555555555555555,
    0.024390243902439025, 0.31613056192207334, 0.08119094120192633,
  ],
}

// TODO: Placeholder - Replace with values from final trained model
export const outputScalerParams: MinMaxScalerParams = {
  min: [-11.197107405358395, -2.0197777680408033],
  scale: [0.31613056192207334, 0.07894843838015173],
}

export class MinMaxScaler {
  private min: number[]
  private scale: number[]

  constructor(params: MinMaxScalerParams) {
    this.min = params.min
    this.scale = params.scale
  }

  transform(values: number[]): number[] {
    return values.map((val, i) => {
      if (!this.min[i] || !this.scale[i]) {
        throw new Error('Values array is too big!')
      }
      return val * this.scale[i] + this.min[i]
    })
  }

  inverseTransform(values: number[]): number[] {
    return values.map((val, i) => {
      if (!this.min[i] || !this.scale[i]) {
        throw new Error('Values array is too big!')
      }
      return (val - this.min[i]) / this.scale[i]
    })
  }
}
