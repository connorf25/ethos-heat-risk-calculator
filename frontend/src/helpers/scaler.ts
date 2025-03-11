// scaler.ts

interface MinMaxScalerParams {
  min: readonly [...number[]] // the min_ attribute taken from sklearn.preprocessing.MinMaxScaler
  scale: readonly [...number[]] // the scale_ attribute taken from sklearn.preprocessing.MinMaxScaler
}

// Helper type to create a tuple of specific length
type NumberTuple<T extends readonly number[], N extends number = T['length']> = [
  number,
  ...number[],
] & { length: N }

// Scaler parameters
// TODO: Placeholder values - replace with values trained on whole dataset
export const featuresScalerParams = {
  min: [
    0.0, -0.3114754098360656, -3.020833333333333, -0.6183587248751761, -1.222222222222222,
    -0.21951219512195122, -11.197107405358395, -2.105553500973682,
  ],
  scale: [
    1.0, 0.01639344262295082, 0.020833333333333332, 0.012802458071949815, 0.05555555555555555,
    0.024390243902439025, 0.31613056192207334, 0.08119094120192633,
  ],
} as const
// TODO: Placeholder values - replace with values trained on whole dataset
export const outputScalerParams = {
  min: [-11.197107405358395, -2.0197777680408033],
  scale: [0.31613056192207334, 0.07894843838015173],
} as const

export class MinMaxScaler<N extends number> {
  private min: readonly number[]
  private scale: readonly number[]
  private length: N

  constructor(params: MinMaxScalerParams) {
    if (params.min.length !== params.scale.length) {
      throw new Error('Min and scale arrays must have the same length')
    }

    this.min = params.min
    this.scale = params.scale
    this.length = params.min.length as N
  }

  transform<A extends NumberTuple<typeof this.min>>(values: A): A {
    if (values.length !== this.length) {
      throw new Error(`Values array must have length ${this.length}`)
    }

    return values.map((val, i) => {
      if (this.min[i] === undefined || this.scale[i] === undefined) {
        throw new Error('Values array is too big!')
      }
      return val * this.scale[i] + this.min[i]
    }) as A
  }

  inverseTransform<A extends NumberTuple<typeof this.min>>(values: A): A {
    if (values.length !== this.length) {
      throw new Error(`Values array must have length ${this.length}`)
    }

    return values.map((val, i) => {
      if (this.min[i] === undefined || this.scale[i] === undefined) {
        throw new Error('Values array is too big!')
      }
      return (val - this.min[i]) / this.scale[i]
    }) as A
  }
}
