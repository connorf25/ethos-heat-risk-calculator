import { MinMaxScaler, featuresScalerParams, outputScalerParams } from './scaler'

export enum Sex {
  MALE = 0,
  FEMALE = 1,
}

export interface BiophysicalFeatures {
  sex: Sex // 0 = male, 1 = female
  age: number // years
  heightCm: number // cm
  massKg: number // kg
}

export interface EnvironmentalFeatures {
  ambientTemp: number // °C
  humidity: number // %RH
}

export type COEFFICIENT_ARRAY = [number, number, number, number, number, number, number, number]

interface PredictionProgress {
  currentStep: number
  totalSteps: number
}

export class TemperaturePredictor {
  // Scalers
  private featuresScaler = new MinMaxScaler(featuresScalerParams)
  private outputScaler = new MinMaxScaler(outputScalerParams)
  // Features
  private biophysicalFeatures = undefined as undefined | BiophysicalFeatures
  // Coefficients
  // TODO: Placeholder values - replace with values trained on whole dataset
  private treCoeffs: COEFFICIENT_ARRAY = [
    1.6261586852849347e-4, 7.3681421437795942e-4, -4.3916987857211637e-4, 4.6532701146677997e-4,
    8.4439348066203668e-4, 6.6633790662377142e-4, 9.9328104284890562e-1, 6.0162332082507909e-3,
  ]
  private treIntercept = -1.3528489525256315e-3
  private mtskCoeffs: COEFFICIENT_ARRAY = [
    6.1578454528691509e-4, 1.4854705372386215e-4, -4.3298261693481378e-4, -1.1471088118388912e-3,
    1.8904677058503336e-2, 3.1889957127636558e-3, -1.0477636196332153e-3, 9.3391821058056301e-1,
  ]
  private mtskIntercept = 4.3563287283298391e-2

  // Define the vapour pressure limit (in kPa)
  // Above this limit, evaporative cooling is significantly impaired, and model predictions may be less reliable.
  private readonly MAX_VAPOUR_PRESSURE_KPA = 6

  // Constructor
  constructor(biophysicalFeatures: BiophysicalFeatures) {
    this.biophysicalFeatures = biophysicalFeatures
  }

  private _calculateVapourPressureKpa(tempC: number, humidityPercent: number): number {
    // Using the Magnus-Tetens approximation for saturated vapour pressure (SVP)
    // SVP(T) = 0.61094 * exp((17.625 * T) / (T + 243.04))  (Result in kPa)
    const svp = 0.61094 * Math.exp((17.625 * tempC) / (tempC + 243.04))
    // Actual Vapour Pressure (AVP) = SVP * Relative Humidity
    const avp = svp * (humidityPercent / 100)
    return avp
  }

  // Calculate final temperature given environmental conditions
  calculateTemperatureAtConditions(
    environmentalFeatures: EnvironmentalFeatures,
    progressCallback?: (progress: PredictionProgress) => void,
  ) {
    // Vapour pressure check
    const actualVapourPressure = this._calculateVapourPressureKpa(
      environmentalFeatures.ambientTemp,
      environmentalFeatures.humidity,
    )
    if (actualVapourPressure >= this.MAX_VAPOUR_PRESSURE_KPA) {
      return {
        rectalTempDelta: null,
        skinTempDelta: null,
      }
    }

    // Initial simulation (air conditioned room)
    const baselineEnvironmentalFeatures = { ambientTemp: 23, humidity: 50 }
    const baselineSimulationTime = 120
    const initialTre = 37
    const initialMtsk = 32
    // Full simulation time
    const actualSimulationTime = 540
    // Calculate baseline temperature
    const baselineTemp = this.predict(
      baselineEnvironmentalFeatures,
      baselineSimulationTime,
      initialTre,
      initialMtsk,
      progressCallback,
    )
    // Calculate rise/fall in temperature
    const finalTemp = this.predict(
      environmentalFeatures,
      actualSimulationTime,
      baselineTemp.rectalTemp,
      baselineTemp.skinTemp,
      progressCallback,
    )
    return {
      rectalTempDelta: finalTemp.rectalTemp - baselineTemp.rectalTemp,
      skinTempDelta: finalTemp.skinTemp - baselineTemp.skinTemp,
    }
  }

  // Predict temperature for a given
  private predict(
    environmentalFeatures: EnvironmentalFeatures,
    durationMinutes: number,
    initialTre = 37,
    initialMtsk = 32,
    progressCallback?: (progress: PredictionProgress) => void,
  ): { rectalTemp: number; skinTemp: number } {
    // Check to see class is correctly initialized
    if (!this.biophysicalFeatures) {
      throw new Error(
        'this.biophysicalFeatures, not defined in class, please initialize in constructor:',
        this.biophysicalFeatures,
      )
    }

    // Scale input features
    const rawFeatures = this.prepareFeatures(
      environmentalFeatures,
      this.biophysicalFeatures,
      initialTre,
      initialMtsk,
    )
    const scaledFeatures = this.featuresScaler.transform(rawFeatures)

    // Precompute static components
    const staticTre = this.calculateStaticComponent(
      scaledFeatures,
      this.treCoeffs,
      this.treIntercept,
    )
    const staticMtsk = this.calculateStaticComponent(
      scaledFeatures,
      this.mtskCoeffs,
      this.mtskIntercept,
    )

    // Initialize temperatures
    let prevTre = scaledFeatures[6] // Initial rectal temp
    let prevMtsk = scaledFeatures[7] // Initial skin temp

    if (prevTre === undefined || prevMtsk === undefined) {
      throw new Error(`Undefined prevTre or prevMtsk before calculations: ${prevTre}, ${prevMtsk}`)
    }

    // Run simulation
    const totalSteps = durationMinutes
    for (let step = 0; step < totalSteps; step++) {
      // Calculate new temperatures
      const newTre = staticTre + this.treCoeffs[6] * prevTre + this.treCoeffs[7] * prevMtsk

      const newMtsk = staticMtsk + this.mtskCoeffs[6] * prevTre + this.mtskCoeffs[7] * prevMtsk

      // Update state for next iteration
      prevTre = newTre
      prevMtsk = newMtsk

      // Report progress if requested
      if (progressCallback && step % 10 === 0) {
        progressCallback({
          currentStep: step,
          totalSteps,
        })
      }
    }

    if (prevTre === undefined || prevMtsk === undefined) {
      throw new Error(`Undefined prevTre or prevMtsk after calculations: ${prevTre}, ${prevMtsk}`)
    }

    // Scale back the final output
    const scaledOutput = [prevTre, prevMtsk] as [number, number]
    const [rectalTemp, skinTemp] = this.outputScaler.inverseTransform(scaledOutput)

    if (rectalTemp === undefined || skinTemp === undefined) {
      throw new Error(
        `Undefined final rectalTemp or skinTemp after calculations: ${prevTre}, ${prevMtsk}`,
      )
    }

    return {
      rectalTemp,
      skinTemp,
    }
  }

  // Prepare features in correct order for scaling
  private prepareFeatures(
    environmental: EnvironmentalFeatures,
    biophysical: BiophysicalFeatures,
    inputTre: number,
    inputMtsk: number,
  ): COEFFICIENT_ARRAY {
    // IMPORTANT: Maintain the exact same feature order used during training
    return [
      biophysical.sex,
      biophysical.age,
      biophysical.heightCm,
      biophysical.massKg,
      environmental.ambientTemp,
      environmental.humidity,
      inputTre,
      inputMtsk,
    ]
  }

  // Calculate static component of regression based of parameters that are fixed
  private calculateStaticComponent(
    scaledFeatures: COEFFICIENT_ARRAY,
    coefficients: COEFFICIENT_ARRAY,
    intercept: number,
  ): number {
    if (scaledFeatures.length < 8) {
      throw new Error()
    }
    // Uses pre-scaled features
    return (
      coefficients[0] * scaledFeatures[0] +
      coefficients[1] * scaledFeatures[1] +
      coefficients[2] * scaledFeatures[2] +
      coefficients[3] * scaledFeatures[3] +
      coefficients[4] * scaledFeatures[4] +
      coefficients[5] * scaledFeatures[5] +
      intercept
    )
  }
}
