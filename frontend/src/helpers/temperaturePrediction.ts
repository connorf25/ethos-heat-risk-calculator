export enum Sex {
  MALE = 0,
  FEMALE = 1,
}

type COEFFICIENT_ARRAY = [number, number, number, number, number, number, number, number]

interface PredictionProgress {
  currentStep: number
  totalSteps: number
}

interface StaticFeatures {
  sex: Sex // 0 = male, 1 = female
  age: number // years
  height: number // cm
  mass: number // kg
  ambientTemp: number // °C
  humidity: number // %RH
}

export class TemperaturePredictor {
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

  predict(
    staticFeatures: StaticFeatures,
    progressCallback?: (progress: PredictionProgress) => void,
  ): { rectalTemp: number; skinTemp: number } {
    // Precompute static components
    const staticTre = this.calculateStaticComponent(
      staticFeatures,
      this.treCoeffs,
      this.treIntercept,
    )
    const staticMtsk = this.calculateStaticComponent(
      staticFeatures,
      this.mtskCoeffs,
      this.mtskIntercept,
    )

    // Initialize temperatures
    let prevTre = 37.0 // Initial rectal temp
    let prevMtsk = 32.0 // Initial skin temp

    // Run simulation
    const totalSteps = 540
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

    return {
      rectalTemp: prevTre,
      skinTemp: prevMtsk,
    }
  }

  private calculateStaticComponent(
    features: StaticFeatures,
    coefficients: COEFFICIENT_ARRAY,
    intercept: number,
  ): number {
    return (
      coefficients[0] * features.sex +
      coefficients[1] * features.age +
      coefficients[2] * features.height +
      coefficients[3] * features.mass +
      coefficients[4] * features.ambientTemp +
      coefficients[5] * features.humidity +
      intercept
    )
  }
}
