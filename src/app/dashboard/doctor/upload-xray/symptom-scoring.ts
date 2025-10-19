/**
 * Symptom Scoring and Confidence Adjustment System
 * 
 * This module implements a clinical decision support system that combines
 * ML model predictions with patient symptoms to improve diagnostic accuracy.
 */

export interface VitalSigns {
  temperature?: number;        // °C
  oxygenSaturation?: number;   // %
  heartRate?: number;          // bpm
  respiratoryRate?: number;    // breaths/min
}

export interface SymptomData {
  // Primary respiratory symptoms
  fever: boolean;
  persistentCough: boolean;
  chestPain: boolean;
  difficultyBreathing: boolean;
  
  // Secondary symptoms
  fatigue: boolean;
  rapidBreathing: boolean;
  cracklingSounds: boolean;
  
  // Cough characteristics
  coughDuration?: number;      // days
  productiveCough: boolean;    // with phlegm
  dryHackingCough: boolean;
  
  // Sputum characteristics
  clearSputum: boolean;
  yellowGreenSputum: boolean;
  bloodInSputum: boolean;
  
  // Onset and progression
  suddenOnset: boolean;
  gradualOnset: boolean;
  symptomDuration?: number;    // days
  
  // Associated symptoms
  muscleAches: boolean;
  chillsAndShaking: boolean;
  headache: boolean;
  soreThroat: boolean;
  nauseaVomiting: boolean;
  confusion: boolean;           // especially in elderly
  
  // Risk factors
  recentColdFlu: boolean;
  weakenedImmuneSystem: boolean;
  smoker: boolean;
  age65Plus: boolean;
  ageUnder5: boolean;
  chronicLungDisease: boolean;
  heartDisease: boolean;
  diabetes: boolean;
  
  // COVID-19 Specific Signatures
  lossOfTasteSmell?: boolean;
  knownCovidExposure?: boolean;
  suddenSevereBreathing?: boolean;
  
  // TB Specific Signatures
  nightSweats?: boolean;
  weightLoss?: boolean;
  unintentionalWeightLoss?: boolean;
  chronicCough?: boolean;
  chronicCoughWeeks?: number;         // Duration in weeks
  hemoptysis?: boolean;               // Blood in sputum (also covered by bloodInSputum)
  travelToTBEndemicArea?: boolean;
  hivPositiveOrImmunocompromised?: boolean;
  closeContactWithTBPatient?: boolean;
  
  // Vital signs
  vitalSigns?: VitalSigns;
}

/**
 * Symptom weight configuration
 * Based on clinical guidelines and medical literature
 */
const SYMPTOM_WEIGHTS = {
  // Primary pneumonia symptoms (highest weight)
  fever: 15,
  persistentCough: 12,
  chestPain: 10,
  difficultyBreathing: 15,
  
  // Secondary symptoms
  fatigue: 5,
  rapidBreathing: 8,
  cracklingSounds: 10,
  
  // Sputum characteristics
  productiveCough: 6,
  yellowGreenSputum: 8,
  bloodInSputum: 7,
  
  // Onset patterns
  suddenOnset: 7,
  gradualOnset: 4,
  
  // Associated symptoms
  chillsAndShaking: 6,
  muscleAches: 4,
  headache: 3,
  confusion: 8,
  
  // Risk factors
  recentColdFlu: 5,
  weakenedImmuneSystem: 7,
  smoker: 3,
  age65Plus: 5,
  ageUnder5: 5,
  chronicLungDisease: 6,
  heartDisease: 4,
  diabetes: 3,
};

/**
 * Viral pneumonia indicators
 */
const VIRAL_INDICATORS = {
  gradualOnset: 5,
  dryHackingCough: 5,
  muscleAches: 4,
  headache: 3,
  soreThroat: 4,
  clearSputum: 3,
  mildFever: 3,  // <39°C
};

/**
 * Bacterial pneumonia indicators
 */
const BACTERIAL_INDICATORS = {
  suddenOnset: 7,
  productiveCough: 6,
  yellowGreenSputum: 8,
  bloodInSputum: 7,
  chillsAndShaking: 6,
  highFever: 8,  // ≥39°C
  cracklingSounds: 8,
};

/**
 * Calculate vital signs score
 */
function calculateVitalSignsScore(vitalSigns?: VitalSigns): {
  score: number;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  indicators: { viral: number; bacterial: number };
} {
  if (!vitalSigns) {
    return { score: 0, severity: 'normal', indicators: { viral: 0, bacterial: 0 } };
  }
  
  let score = 0;
  let viralScore = 0;
  let bacterialScore = 0;
  
  // Temperature assessment
  if (vitalSigns.temperature) {
    if (vitalSigns.temperature >= 39) {
      score += 15;
      bacterialScore += 8;
    } else if (vitalSigns.temperature >= 38) {
      score += 10;
      viralScore += 3;
    } else if (vitalSigns.temperature >= 37.5) {
      score += 5;
    }
  }
  
  // Oxygen saturation (hypoxemia)
  if (vitalSigns.oxygenSaturation) {
    if (vitalSigns.oxygenSaturation < 90) {
      score += 20; // Critical
    } else if (vitalSigns.oxygenSaturation < 94) {
      score += 12;
    } else if (vitalSigns.oxygenSaturation < 96) {
      score += 6;
    }
  }
  
  // Respiratory rate (tachypnea)
  if (vitalSigns.respiratoryRate) {
    if (vitalSigns.respiratoryRate > 30) {
      score += 15;
    } else if (vitalSigns.respiratoryRate > 24) {
      score += 10;
    } else if (vitalSigns.respiratoryRate > 20) {
      score += 5;
    }
  }
  
  // Heart rate (tachycardia)
  if (vitalSigns.heartRate) {
    if (vitalSigns.heartRate > 120) {
      score += 8;
    } else if (vitalSigns.heartRate > 100) {
      score += 5;
    }
  }
  
  // Determine severity
  let severity: 'normal' | 'mild' | 'moderate' | 'severe' = 'normal';
  if (score >= 40) severity = 'severe';
  else if (score >= 25) severity = 'moderate';
  else if (score >= 10) severity = 'mild';
  
  return { score, severity, indicators: { viral: viralScore, bacterial: bacterialScore } };
}

/**
 * Calculate symptom score (0-100)
 */
export function calculateSymptomScore(symptoms: SymptomData): {
  totalScore: number;
  viralScore: number;
  bacterialScore: number;
  normalScore: number;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  primarySymptomsCount: number;
} {
  let totalScore = 0;
  let viralScore = 0;
  let bacterialScore = 0;
  let primarySymptomsCount = 0;
  
  // Calculate vital signs contribution
  const vitalSignsResult = calculateVitalSignsScore(symptoms.vitalSigns);
  totalScore += vitalSignsResult.score;
  viralScore += vitalSignsResult.indicators.viral;
  bacterialScore += vitalSignsResult.indicators.bacterial;
  
  // Primary symptoms
  if (symptoms.fever) {
    totalScore += SYMPTOM_WEIGHTS.fever;
    primarySymptomsCount++;
  }
  if (symptoms.persistentCough) {
    totalScore += SYMPTOM_WEIGHTS.persistentCough;
    primarySymptomsCount++;
  }
  if (symptoms.chestPain) {
    totalScore += SYMPTOM_WEIGHTS.chestPain;
    primarySymptomsCount++;
  }
  if (symptoms.difficultyBreathing) {
    totalScore += SYMPTOM_WEIGHTS.difficultyBreathing;
    primarySymptomsCount++;
  }
  
  // Secondary symptoms
  if (symptoms.fatigue) totalScore += SYMPTOM_WEIGHTS.fatigue;
  if (symptoms.rapidBreathing) totalScore += SYMPTOM_WEIGHTS.rapidBreathing;
  if (symptoms.cracklingSounds) {
    totalScore += SYMPTOM_WEIGHTS.cracklingSounds;
    bacterialScore += BACTERIAL_INDICATORS.cracklingSounds;
  }
  
  // Cough characteristics
  if (symptoms.productiveCough) {
    totalScore += SYMPTOM_WEIGHTS.productiveCough;
    bacterialScore += BACTERIAL_INDICATORS.productiveCough;
  }
  if (symptoms.dryHackingCough) {
    viralScore += VIRAL_INDICATORS.dryHackingCough;
  }
  
  // Sputum characteristics
  if (symptoms.yellowGreenSputum) {
    totalScore += SYMPTOM_WEIGHTS.yellowGreenSputum;
    bacterialScore += BACTERIAL_INDICATORS.yellowGreenSputum;
  }
  if (symptoms.bloodInSputum) {
    totalScore += SYMPTOM_WEIGHTS.bloodInSputum;
    bacterialScore += BACTERIAL_INDICATORS.bloodInSputum;
  }
  if (symptoms.clearSputum) {
    viralScore += VIRAL_INDICATORS.clearSputum;
  }
  
  // Onset pattern
  if (symptoms.suddenOnset) {
    totalScore += SYMPTOM_WEIGHTS.suddenOnset;
    bacterialScore += BACTERIAL_INDICATORS.suddenOnset;
  }
  if (symptoms.gradualOnset) {
    totalScore += SYMPTOM_WEIGHTS.gradualOnset;
    viralScore += VIRAL_INDICATORS.gradualOnset;
  }
  
  // Associated symptoms
  if (symptoms.chillsAndShaking) {
    totalScore += SYMPTOM_WEIGHTS.chillsAndShaking;
    bacterialScore += BACTERIAL_INDICATORS.chillsAndShaking;
  }
  if (symptoms.muscleAches) {
    totalScore += SYMPTOM_WEIGHTS.muscleAches;
    viralScore += VIRAL_INDICATORS.muscleAches;
  }
  if (symptoms.headache) {
    totalScore += SYMPTOM_WEIGHTS.headache;
    viralScore += VIRAL_INDICATORS.headache;
  }
  if (symptoms.soreThroat) {
    viralScore += VIRAL_INDICATORS.soreThroat;
  }
  if (symptoms.confusion) {
    totalScore += SYMPTOM_WEIGHTS.confusion;
  }
  
  // Risk factors
  if (symptoms.recentColdFlu) totalScore += SYMPTOM_WEIGHTS.recentColdFlu;
  if (symptoms.weakenedImmuneSystem) totalScore += SYMPTOM_WEIGHTS.weakenedImmuneSystem;
  if (symptoms.smoker) totalScore += SYMPTOM_WEIGHTS.smoker;
  if (symptoms.age65Plus) totalScore += SYMPTOM_WEIGHTS.age65Plus;
  if (symptoms.ageUnder5) totalScore += SYMPTOM_WEIGHTS.ageUnder5;
  if (symptoms.chronicLungDisease) totalScore += SYMPTOM_WEIGHTS.chronicLungDisease;
  if (symptoms.heartDisease) totalScore += SYMPTOM_WEIGHTS.heartDisease;
  if (symptoms.diabetes) totalScore += SYMPTOM_WEIGHTS.diabetes;
  
  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, totalScore);
  
  // Calculate "normal" score (inverse of pneumonia symptoms)
  const normalScore = Math.max(0, 100 - normalizedScore);
  
  // Determine severity
  let severity: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
  if (normalizedScore >= 70) severity = 'severe';
  else if (normalizedScore >= 50) severity = 'moderate';
  else if (normalizedScore >= 30) severity = 'mild';
  
  return {
    totalScore: normalizedScore,
    viralScore,
    bacterialScore,
    normalScore,
    severity,
    primarySymptomsCount
  };
}

/**
 * Adjust model confidence based on symptom correlation
 */
export function adjustConfidenceWithSymptoms(
  modelPrediction: 'NORMAL' | 'BACTERIAL_PNEUMONIA' | 'VIRAL_PNEUMONIA',
  modelConfidence: number,
  symptomData: SymptomData
): {
  adjustedConfidence: number;
  symptomScore: number;
  clinicalCorrelation: 'strong' | 'moderate' | 'weak' | 'conflicting';
  recommendation: string;
  confidenceBreakdown: {
    modelConfidence: number;
    symptomContribution: number;
    adjustmentFactor: number;
  };
} {
  const symptomAnalysis = calculateSymptomScore(symptomData);
  const { totalScore: symptomScore, viralScore, bacterialScore, normalScore, primarySymptomsCount } = symptomAnalysis;
  
  let adjustedConfidence = modelConfidence;
  let clinicalCorrelation: 'strong' | 'moderate' | 'weak' | 'conflicting' = 'weak';
  let recommendation = '';
  let adjustmentFactor = 0;
  
  // Case 1: Model predicts NORMAL
  if (modelPrediction === 'NORMAL') {
    if (symptomScore < 20) {
      // Strong agreement: Model says normal, few symptoms
      clinicalCorrelation = 'strong';
      adjustmentFactor = 0.05; // Small boost for strong correlation
      adjustedConfidence = Math.min(0.98, modelConfidence + adjustmentFactor);
      recommendation = 'Normal scan with minimal symptoms. Clinical correlation supports normal finding.';
    } else if (symptomScore < 40) {
      // Moderate symptoms but normal scan
      clinicalCorrelation = 'moderate';
      adjustmentFactor = -0.05;
      adjustedConfidence = Math.max(0.60, modelConfidence + adjustmentFactor);
      recommendation = 'Normal scan but patient presents with some symptoms. Consider other differential diagnoses or early-stage infection not yet visible on X-ray.';
    } else {
      // High symptoms but normal scan - potential conflict
      clinicalCorrelation = 'conflicting';
      adjustmentFactor = -0.15;
      adjustedConfidence = Math.max(0.50, modelConfidence + adjustmentFactor);
      recommendation = 'CAUTION: Significant symptoms present but scan appears normal. Recommend clinical correlation, consider repeat imaging in 24-48 hours, or alternative diagnoses.';
    }
  }
  
  // Case 2: Model predicts BACTERIAL PNEUMONIA
  else if (modelPrediction === 'BACTERIAL_PNEUMONIA') {
    if (bacterialScore > viralScore && symptomScore >= 40) {
      // Strong bacterial indicators with high symptoms
      clinicalCorrelation = 'strong';
      const symptomBoost = (symptomScore / 100) * 0.15; // Up to 15% boost
      adjustmentFactor = symptomBoost;
      adjustedConfidence = Math.min(0.96, modelConfidence + symptomBoost);
      recommendation = 'Bacterial pneumonia with strong clinical correlation. Symptoms align with imaging findings.';
    } else if (bacterialScore > viralScore && symptomScore >= 25) {
      // Moderate correlation
      clinicalCorrelation = 'moderate';
      const symptomBoost = (symptomScore / 100) * 0.10;
      adjustmentFactor = symptomBoost;
      adjustedConfidence = Math.min(0.92, modelConfidence + symptomBoost);
      recommendation = 'Bacterial pneumonia with moderate symptom correlation. Clinical presentation supports diagnosis.';
    } else if (viralScore > bacterialScore) {
      // Symptoms suggest viral but model says bacterial
      clinicalCorrelation = 'conflicting';
      adjustmentFactor = -0.10;
      adjustedConfidence = Math.max(0.60, modelConfidence - 0.10);
      recommendation = 'Model suggests bacterial pneumonia but symptoms are more consistent with viral etiology. Consider mixed infection or atypical presentation.';
    } else if (symptomScore < 20) {
      // Model says bacterial but few symptoms
      clinicalCorrelation = 'weak';
      adjustmentFactor = -0.12;
      adjustedConfidence = Math.max(0.55, modelConfidence - 0.12);
      recommendation = 'Imaging suggests bacterial pneumonia but patient is minimally symptomatic. Consider subclinical or early-stage infection, or possible false positive.';
    } else {
      clinicalCorrelation = 'moderate';
      recommendation = 'Bacterial pneumonia detected. Clinical correlation is moderate.';
    }
  }
  
  // Case 3: Model predicts VIRAL PNEUMONIA
  else if (modelPrediction === 'VIRAL_PNEUMONIA') {
    if (viralScore > bacterialScore && symptomScore >= 40) {
      // Strong viral indicators with high symptoms
      clinicalCorrelation = 'strong';
      const symptomBoost = (symptomScore / 100) * 0.15;
      adjustmentFactor = symptomBoost;
      adjustedConfidence = Math.min(0.96, modelConfidence + symptomBoost);
      recommendation = 'Viral pneumonia with strong clinical correlation. Symptoms align with imaging findings.';
    } else if (viralScore > bacterialScore && symptomScore >= 25) {
      // Moderate correlation
      clinicalCorrelation = 'moderate';
      const symptomBoost = (symptomScore / 100) * 0.10;
      adjustmentFactor = symptomBoost;
      adjustedConfidence = Math.min(0.92, modelConfidence + symptomBoost);
      recommendation = 'Viral pneumonia with moderate symptom correlation. Clinical presentation supports diagnosis.';
    } else if (bacterialScore > viralScore) {
      // Symptoms suggest bacterial but model says viral
      clinicalCorrelation = 'conflicting';
      adjustmentFactor = -0.10;
      adjustedConfidence = Math.max(0.60, modelConfidence - 0.10);
      recommendation = 'Model suggests viral pneumonia but symptoms are more consistent with bacterial etiology. Consider bacterial superinfection or atypical presentation.';
    } else if (symptomScore < 20) {
      // Model says viral but few symptoms
      clinicalCorrelation = 'weak';
      adjustmentFactor = -0.12;
      adjustedConfidence = Math.max(0.55, modelConfidence - 0.12);
      recommendation = 'Imaging suggests viral pneumonia but patient is minimally symptomatic. Consider subclinical or resolving infection.';
    } else {
      clinicalCorrelation = 'moderate';
      recommendation = 'Viral pneumonia detected. Clinical correlation is moderate.';
    }
  }
  
  return {
    adjustedConfidence: Number(adjustedConfidence.toFixed(4)),
    symptomScore,
    clinicalCorrelation,
    recommendation,
    confidenceBreakdown: {
      modelConfidence,
      symptomContribution: symptomScore / 100,
      adjustmentFactor: Number(adjustmentFactor.toFixed(4))
    }
  };
}

/**
 * Generate clinical summary based on symptoms
 */
export function generateClinicalSummary(symptoms: SymptomData): string {
  const analysis = calculateSymptomScore(symptoms);
  const { totalScore, viralScore, bacterialScore, primarySymptomsCount, severity } = analysis;
  
  let summary = `Patient presents with ${primarySymptomsCount} primary pneumonia symptom(s). `;
  
  if (severity === 'severe') {
    summary += 'Symptom severity: SEVERE. ';
  } else if (severity === 'moderate') {
    summary += 'Symptom severity: MODERATE. ';
  } else if (severity === 'mild') {
    summary += 'Symptom severity: MILD. ';
  }
  
  if (bacterialScore > viralScore && bacterialScore > 15) {
    summary += 'Clinical presentation more consistent with BACTERIAL pneumonia (sudden onset, high fever, productive cough). ';
  } else if (viralScore > bacterialScore && viralScore > 15) {
    summary += 'Clinical presentation more consistent with VIRAL pneumonia (gradual onset, dry cough, muscle aches). ';
  }
  
  if (symptoms.vitalSigns) {
    const vitalResult = calculateVitalSignsScore(symptoms.vitalSigns);
    if (vitalResult.severity === 'severe') {
      summary += 'WARNING: Vital signs indicate severe distress. ';
    } else if (vitalResult.severity === 'moderate') {
      summary += 'Vital signs show moderate abnormality. ';
    }
  }
  
  return summary.trim();
}

/**
 * COVID-19 Signature Symptom Weights
 */
const COVID_SIGNATURE_WEIGHTS = {
  lossOfTasteSmell: 30,                    // Very specific to COVID
  knownCovidExposure: 15,
  suddenSevereBreathing: 10,
  silentHypoxia: 12,                       // Low O2 despite minimal symptoms
};

/**
 * TB Signature Symptom Weights
 */
const TB_SIGNATURE_WEIGHTS = {
  nightSweats: 25,                         // Very specific to TB
  weightLoss: 20,
  hemoptysis: 25,                          // Highly suspicious for TB
  chronicCoughPerWeek: 5,                  // Per week (>3 weeks)
  travelToTBEndemicArea: 10,
  hivPositiveOrImmunocompromised: 15,
  closeContactWithTBPatient: 20,
};

/**
 * Detect COVID-19 risk based on signature symptoms
 */
export function detectCovidRisk(symptoms: SymptomData): {
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  indicators: string[];
} {
  let score = 0;
  const indicators: string[] = [];
  
  // Loss of taste/smell - highly specific to COVID (80%+ specificity)
  if (symptoms.lossOfTasteSmell) {
    score += COVID_SIGNATURE_WEIGHTS.lossOfTasteSmell;
    indicators.push("Loss of taste/smell (80% specific to COVID-19)");
  }
  
  // Known COVID exposure
  if (symptoms.knownCovidExposure) {
    score += COVID_SIGNATURE_WEIGHTS.knownCovidExposure;
    indicators.push("Known COVID-19 exposure or contact");
  }
  
  // Sudden severe breathing difficulty
  if (symptoms.suddenSevereBreathing) {
    score += COVID_SIGNATURE_WEIGHTS.suddenSevereBreathing;
    indicators.push("Sudden severe breathing difficulty");
  }
  
  // Silent hypoxia - low O2 despite minimal symptoms (COVID phenomenon)
  if (symptoms.vitalSigns?.oxygenSaturation && symptoms.vitalSigns.oxygenSaturation < 94) {
    const hasMinimalSymptoms = !symptoms.fever && !symptoms.persistentCough && !symptoms.difficultyBreathing;
    if (hasMinimalSymptoms) {
      score += COVID_SIGNATURE_WEIGHTS.silentHypoxia;
      indicators.push("Silent hypoxia (low O2 saturation <94% with minimal symptoms - classic COVID sign)");
    }
  }
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  if (score >= 40) riskLevel = 'VERY_HIGH';
  else if (score >= 25) riskLevel = 'HIGH';
  else if (score >= 15) riskLevel = 'MODERATE';
  else riskLevel = 'LOW';
  
  return { riskScore: score, riskLevel, indicators };
}

/**
 * Detect TB risk based on signature symptoms
 */
export function detectTBRisk(symptoms: SymptomData): {
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  indicators: string[];
} {
  let score = 0;
  const indicators: string[] = [];
  
  // Night sweats - very specific to TB (90%+ specificity when drenching)
  if (symptoms.nightSweats) {
    score += TB_SIGNATURE_WEIGHTS.nightSweats;
    indicators.push("Drenching night sweats (90% specific to TB)");
  }
  
  // Unintentional weight loss
  if (symptoms.weightLoss || symptoms.unintentionalWeightLoss) {
    score += TB_SIGNATURE_WEIGHTS.weightLoss;
    indicators.push("Unintentional weight loss");
  }
  
  // Hemoptysis (blood in sputum) - highly suspicious for TB
  if (symptoms.hemoptysis || symptoms.bloodInSputum) {
    score += TB_SIGNATURE_WEIGHTS.hemoptysis;
    indicators.push("Hemoptysis (coughing blood - highly suspicious for TB)");
  }
  
  // Chronic cough (>3 weeks is TB suspect threshold)
  if (symptoms.chronicCoughWeeks && symptoms.chronicCoughWeeks >= 3) {
    score += TB_SIGNATURE_WEIGHTS.chronicCoughPerWeek * symptoms.chronicCoughWeeks;
    indicators.push(`Chronic cough for ${symptoms.chronicCoughWeeks} weeks (>3 weeks = TB suspect)`);
  } else if (symptoms.chronicCough && symptoms.symptomDuration && symptoms.symptomDuration >= 21) {
    // If chronic cough checked and duration >21 days (3 weeks)
    const weeks = Math.floor(symptoms.symptomDuration / 7);
    score += TB_SIGNATURE_WEIGHTS.chronicCoughPerWeek * weeks;
    indicators.push(`Chronic cough for ~${weeks} weeks`);
  }
  
  // Travel to TB-endemic area
  if (symptoms.travelToTBEndemicArea) {
    score += TB_SIGNATURE_WEIGHTS.travelToTBEndemicArea;
    indicators.push("Travel to TB-endemic area");
  }
  
  // HIV positive or immunocompromised
  if (symptoms.hivPositiveOrImmunocompromised) {
    score += TB_SIGNATURE_WEIGHTS.hivPositiveOrImmunocompromised;
    indicators.push("HIV+ or immunocompromised (high TB risk)");
  }
  
  // Close contact with TB patient
  if (symptoms.closeContactWithTBPatient) {
    score += TB_SIGNATURE_WEIGHTS.closeContactWithTBPatient;
    indicators.push("Close contact with TB patient");
  }
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  if (score >= 50) riskLevel = 'VERY_HIGH';
  else if (score >= 30) riskLevel = 'HIGH';
  else if (score >= 15) riskLevel = 'MODERATE';
  else riskLevel = 'LOW';
  
  return { riskScore: score, riskLevel, indicators };
}

/**
 * Generate special alert message for COVID/TB cross-validation
 */
export function generateCrossValidationAlert(
  modelPrediction: string,
  covidRisk: ReturnType<typeof detectCovidRisk>,
  tbRisk: ReturnType<typeof detectTBRisk>
): {
  hasAlert: boolean;
  alertLevel: 'INFO' | 'WARNING' | 'CRITICAL';
  alertMessage: string;
  recommendedActions: string[];
} {
  const actions: string[] = [];
  let hasAlert = false;
  let alertLevel: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
  let alertMessage = '';
  
  // CRITICAL: Model says COVID, symptoms confirm
  if (modelPrediction === 'COVID' && (covidRisk.riskLevel === 'HIGH' || covidRisk.riskLevel === 'VERY_HIGH')) {
    hasAlert = true;
    alertLevel = 'CRITICAL';
    alertMessage = `🦠 COVID-19 DETECTED - High clinical correlation\n\nImaging: COVID-19 pneumonia pattern\nSymptoms: ${covidRisk.indicators.join(', ')}`;
    actions.push('PCR test for confirmation');
    actions.push('Isolate patient immediately');
    actions.push('Contact tracing');
    actions.push('Follow COVID-19 protocol');
  }
  
  // CRITICAL: Model says TB, symptoms confirm
  else if (modelPrediction === 'TB' && (tbRisk.riskLevel === 'HIGH' || tbRisk.riskLevel === 'VERY_HIGH')) {
    hasAlert = true;
    alertLevel = 'CRITICAL';
    alertMessage = `🚨 TUBERCULOSIS DETECTED - High clinical correlation\n\nImaging: TB pattern\nSymptoms: ${tbRisk.indicators.join(', ')}`;
    actions.push('IMMEDIATE respiratory isolation');
    actions.push('Sputum AFB smear x3');
    actions.push('GeneXpert/TB PCR');
    actions.push('Notify public health department');
    actions.push('Contact tracing');
    actions.push('HIV test if status unknown');
  }
  
  // CRITICAL: High COVID risk despite other diagnosis
  else if (modelPrediction !== 'COVID' && (covidRisk.riskLevel === 'HIGH' || covidRisk.riskLevel === 'VERY_HIGH')) {
    hasAlert = true;
    alertLevel = 'CRITICAL';
    alertMessage = `🚨 COVID-19 SUSPECTED despite imaging showing ${modelPrediction}\n\nWARNING: Early COVID may have normal or minimal X-ray changes!\n\nSymptoms: ${covidRisk.indicators.join(', ')}`;
    actions.push('COVID PCR test IMMEDIATELY');
    actions.push('Isolate patient as precaution');
    actions.push('Do NOT rule out COVID based on X-ray alone');
    actions.push('Consider CT chest if PCR positive');
    actions.push('Repeat X-ray in 24-48h if symptoms worsen');
  }
  
  // CRITICAL: High TB risk despite other diagnosis
  else if (modelPrediction !== 'TB' && (tbRisk.riskLevel === 'HIGH' || tbRisk.riskLevel === 'VERY_HIGH')) {
    hasAlert = true;
    alertLevel = 'CRITICAL';
    alertMessage = `🚨 TUBERCULOSIS SUSPECTED despite imaging showing ${modelPrediction}\n\nWARNING: Early TB or extrapulmonary TB may have normal/minimal X-ray!\n\nSymptoms: ${tbRisk.indicators.join(', ')}`;
    actions.push('TB workup REQUIRED (Sputum AFB, GeneXpert)');
    actions.push('Clinical evaluation for TB');
    actions.push('Consider CT chest for better sensitivity');
    actions.push('HIV testing if status unknown');
    actions.push('TB skin test or IGRA');
    actions.push('Do NOT rule out TB based on X-ray alone');
  }
  
  // WARNING: Moderate COVID risk
  else if (covidRisk.riskLevel === 'MODERATE') {
    hasAlert = true;
    alertLevel = 'WARNING';
    alertMessage = `⚠️ Moderate COVID-19 risk detected\n\nSymptoms: ${covidRisk.indicators.join(', ')}`;
    actions.push('Consider COVID PCR test');
    actions.push('Monitor symptoms closely');
    actions.push('Follow up in 24-48 hours');
  }
  
  // WARNING: Moderate TB risk
  else if (tbRisk.riskLevel === 'MODERATE') {
    hasAlert = true;
    alertLevel = 'WARNING';
    alertMessage = `⚠️ Moderate TB risk detected\n\nSymptoms: ${tbRisk.indicators.join(', ')}`;
    actions.push('Consider TB screening (sputum AFB, TB skin test)');
    actions.push('Clinical evaluation');
    actions.push('Monitor for worsening symptoms');
  }
  
  return {
    hasAlert,
    alertLevel,
    alertMessage,
    recommendedActions: actions
  };
}

/**
 * Clinical Recommendations Interface
 */
export interface ClinicalRecommendation {
  title: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  recommendation: string;
  diagnosticTests: string[];
  treatmentOptions: string[];
  followUp: string[];
  warnings: string[];
}

/**
 * Generate comprehensive clinical recommendations based on diagnosis and patient data
 */
export function generateClinicalRecommendations(
  prediction: string,
  confidence: number,
  symptoms: SymptomData | null,
  patientAge?: string,
  medicalHistory?: string
): ClinicalRecommendation {
  const age = patientAge ? parseInt(patientAge) : 0;
  const isElderly = age >= 65;
  const isChild = age < 5;
  const hasChronicCondition = medicalHistory?.toLowerCase().includes('chronic') || 
                              medicalHistory?.toLowerCase().includes('diabetes') ||
                              medicalHistory?.toLowerCase().includes('heart');
  
  // Base urgency assessment
  let baseUrgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
  if (confidence > 85) baseUrgency = confidence > 95 ? 'CRITICAL' : 'HIGH';
  if (symptoms?.difficultyBreathing || symptoms?.confusion) baseUrgency = 'CRITICAL';
  
  switch (prediction) {
    case 'BACTERIAL_PNEUMONIA': {
      const urgency = (isElderly || isChild || hasChronicCondition) ? 'HIGH' : 
                      (confidence > 90 || symptoms?.bloodInSputum) ? 'HIGH' : 
                      baseUrgency;
      
      return {
        title: 'Bacterial Pneumonia',
        urgency,
        recommendation: `Immediate antibiotic treatment recommended. ${
          isElderly ? 'CAUTION: Elderly patient - consider hospital admission.' : ''
        } ${
          symptoms?.difficultyBreathing ? 'URGENT: Respiratory distress noted - assess for hospitalization.' : ''
        } Start empiric antibiotic therapy covering Streptococcus pneumoniae, Haemophilus influenzae, and atypical organisms. Reassess clinically within 48-72 hours.`,
        diagnosticTests: [
          'Complete blood count with differential',
          'Blood cultures (before antibiotics if possible)',
          'Sputum Gram stain and culture (if productive cough)',
          'Pulse oximetry / ABG if SpO2 < 92%',
          'CRP and procalcitonin levels',
          symptoms?.bloodInSputum ? 'Coagulation profile' : '',
          isElderly || hasChronicCondition ? 'Comprehensive metabolic panel' : ''
        ].filter(Boolean),
        treatmentOptions: [
          isElderly || hasChronicCondition ? 
            'Hospitalization recommended - consider IV antibiotics' :
            'Outpatient: Amoxicillin-clavulanate 875/125mg BID or doxycycline 100mg BID',
          'Alternative: Azithromycin 500mg daily for 3 days or clarithromycin 500mg BID',
          'Severe cases: IV ceftriaxone 1-2g daily or fluoroquinolone',
          'Duration: 5-7 days for uncomplicated, 7-10 days for severe',
          'Oxygen therapy if SpO2 < 92%',
          'Symptomatic treatment: acetaminophen or ibuprofen for fever/pain'
        ],
        followUp: [
          'Clinical assessment within 48-72 hours',
          'Chest X-ray in 4-6 weeks to confirm resolution',
          'For patients not improving: Consider hospital admission, antibiotic change, or imaging (CT chest)',
          isElderly ? 'Contact follow-up within 24 hours for elderly patients' : '',
          'Patient education on recognizing worsening symptoms'
        ].filter(Boolean),
        warnings: [
          'High fever (>39°C) or septic appearance requires urgent evaluation',
          'Respiratory rate > 30 or SpO2 < 92% warrants hospital admission',
          symptoms?.bloodInSputum ? 'Hemoptysis may indicate severe infection or necrotizing pneumonia' : '',
          'Watch for secondary complications: empyema, lung abscess, sepsis'
        ].filter(Boolean)
      };
    }
    
    case 'VIRAL_PNEUMONIA': {
      const urgency = (symptoms?.difficultyBreathing || isElderly) ? 'HIGH' : 
                      confidence > 90 ? 'MODERATE' : 'LOW';
      
      return {
        title: 'Viral Pneumonia',
        urgency,
        recommendation: `Supportive care is primary treatment. Monitor closely for bacterial superinfection. ${
          symptoms?.difficultyBreathing ? 'URGENT: Assess for hypoxemia and hospitalization need.' : ''
        } Consider antiviral therapy (oseltamivir) if influenza suspected within 48 hours of symptom onset. Antibiotics only if secondary bacterial infection suspected.`,
        diagnosticTests: [
          'Respiratory pathogen PCR panel (includes influenza, RSV, COVID-19, parainfluenza)',
          symptoms?.difficultyBreathing ? 'Pulse oximetry / ABG' : 'Pulse oximetry',
          'Complete blood count',
          'Consider blood cultures if clinical deterioration',
          symptoms?.fever ? 'CRP if available' : ''
        ].filter(Boolean),
        treatmentOptions: [
          'Supportive care: Rest, hydration, antipyretics (acetaminophen 500-1000mg Q4-6H or ibuprofen 400-600mg Q6H)',
          'Antiviral therapy: Oseltamivir (Tamiflu) 75mg BID for 5 days if influenza (especially if started within 48 hours)',
          'Avoid antibiotics unless secondary bacterial infection suspected',
          'Oxygen therapy if SpO2 < 92% or respiratory distress',
          'Monitor for secondary bacterial infection - start antibiotics if high fever returns after initial improvement'
        ],
        followUp: [
          'Clinical assessment in 3-5 days',
          'If not improving: Reassess for secondary bacterial infection or other diagnoses',
          'Contact precautions if living with high-risk individuals',
          'Repeat imaging usually not needed unless worsening or prolonged symptoms',
          symptoms?.difficultyBreathing ? 'Close monitoring for clinical deterioration' : ''
        ].filter(Boolean),
        warnings: [
          'Most viral pneumonias are self-limited - recovery usually within 2-4 weeks',
          'Risk of secondary bacterial superinfection - educate patient on warning signs',
          'Some viral pneumonias (influenza, COVID-19) can cause severe ARDS - monitor SpO2 closely',
          isElderly ? 'Elderly patients have higher risk of severe disease and complications' : ''
        ].filter(Boolean)
      };
    }
    
    case 'NORMAL': {
      return {
        title: 'Normal Findings',
        urgency: symptoms && (symptoms.persistentCough || symptoms.fever || symptoms.difficultyBreathing) ? 'MODERATE' : 'LOW',
        recommendation: `No significant radiographic findings. ${
          symptoms && (symptoms.persistentCough || symptoms.fever) ? 
            'However, patient presents with symptoms. Consider clinical correlation, viral prodrome, or early-stage infection not yet visible on X-ray. Repeat imaging in 24-48 hours may be warranted if symptoms persist or worsen.' : 
            'Patient appears clinically well.'
        }`,
        diagnosticTests: symptoms && (symptoms.persistentCough || symptoms.fever) ? [
          'Viral respiratory pathogen panel',
          'Complete blood count',
          'Pulse oximetry',
          'Follow-up chest X-ray in 24-48 hours if symptoms persist'
        ] : ['Pulse oximetry if symptomatic'],
        treatmentOptions: symptoms && (symptoms.persistentCough || symptoms.fever) ? [
          'Symptomatic treatment: Rest, hydration, antipyretics',
          'Supportive care for probable viral upper respiratory infection',
          'Avoid unnecessary antibiotics',
          'Return precautions: Seek care if breathing worsens, SpO2 drops, or high fever'
        ] : [
          'Continue current management',
          'No specific treatment needed for normal X-ray',
          'Reassuring patient may reduce anxiety'
        ],
        followUp: symptoms && (symptoms.persistentCough || symptoms.fever) ? [
          'Clinical assessment in 24-48 hours',
          'Repeat chest X-ray if symptoms do not improve',
          'Consider other diagnoses if findings change'
        ] : [
          'No follow-up imaging needed'
        ],
        warnings: symptoms && (symptoms.difficultyBreathing) ? [
          '⚠️ Patient has respiratory distress despite normal X-ray - urgent evaluation needed',
          'Consider: Pulmonary embolism, early pneumonia, other cardiopulmonary pathology',
          'May need CT angiography or advanced imaging'
        ] : []
      };
    }
    
    case 'COVID': {
      return {
        title: 'COVID-19 Suspected',
        urgency: 'HIGH',
        recommendation: 'COVID-19 is suspected based on imaging and/or symptoms. This is a validation result only. COVID-19 testing is STRONGLY RECOMMENDED regardless of X-ray findings. Early diagnosis allows for timely isolation and treatment.',
        diagnosticTests: [
          'COVID-19 PCR (nasopharyngeal or oropharyngeal swab) - REQUIRED',
          'Rapid antigen test if PCR not available',
          'Chest CT if X-ray findings unclear (typically bilateral ground glass opacities)',
          'D-dimer if high-risk for pulmonary embolism',
          'Troponin if cardiac involvement suspected'
        ],
        treatmentOptions: [
          'Isolate immediately - inform public health authorities',
          'Supportive care: Rest, hydration, oxygen if SpO2 < 92%',
          'Antiviral therapy: Consider remdesivir for hospitalized patients',
          'Monoclonal antibodies if high-risk and within treatment window',
          'Monitor for thrombotic complications'
        ],
        followUp: [
          'COVID-19 testing MUST be done to confirm/exclude diagnosis',
          'Repeat imaging in 7-10 days if hospitalized',
          'Close contacts should quarantine and monitor for symptoms',
          'Vaccinate after recovery if not previously vaccinated'
        ],
        warnings: [
          '🚨 COVID-19 can cause life-threatening pneumonia and ARDS',
          'Early radiographic findings can be subtle - normal or near-normal X-rays do NOT exclude COVID',
          'CT chest is more sensitive than X-ray for COVID-19 pneumonia',
          'Patients are infectious 24-48 hours before symptom onset'
        ]
      };
    }
    
    case 'TB': {
      return {
        title: 'Tuberculosis Suspected',
        urgency: 'CRITICAL',
        recommendation: 'Tuberculosis is suspected based on clinical and radiographic findings. This requires URGENT investigation. TB can be rapidly progressive and potentially fatal if untreated. Respiratory isolation must be implemented IMMEDIATELY until TB is excluded.',
        diagnosticTests: [
          'Sputum smear microscopy for AFB (Acid-Fast Bacilli) - PRIORITY',
          'GeneXpert MTB/RIF or PCR - REQUIRED for rapid diagnosis',
          'TB culture (slow but gold standard)',
          'HIV testing (TB-HIV coinfection)',
          'Chest CT for better characterization if diagnosis unclear',
          'TB skin test or IGRA after acute phase'
        ],
        treatmentOptions: [
          'Respiratory isolation IMMEDIATELY - place in negative pressure room if hospitalized',
          'Infectious disease consultation REQUIRED',
          'Do NOT wait for confirmatory tests to start treatment if clinical suspicion is high',
          'Standard TB regimen: Isoniazid, Rifampin, Pyrazinamide, Ethambutol for 2 months, then Isoniazid + Rifampin for 4 months',
          'Drug susceptibility testing to guide therapy'
        ],
        followUp: [
          'TB diagnosis MUST be confirmed with positive smear or culture',
          'Repeat sputum smears at 2 weeks, 4 weeks - goal is smear conversion',
          'Chest X-ray improvement expected at 2-3 months',
          'Contact tracing - identify and evaluate exposed persons',
          'Monitor treatment compliance and side effects'
        ],
        warnings: [
          '🚨 URGENT: TB is highly contagious and can be fatal',
          'TB may have normal or minimal X-ray findings, especially in HIV+ patients',
          'Up to 20-25% of TB patients have normal X-rays',
          'Extrapulmonary TB (lymph, meninges, bone) may have negative CXR',
          'Delayed diagnosis can result in severe disease and death',
          'Contact precautions must continue until patient is smear-negative and on treatment'
        ]
      };
    }
    
    case 'NON_XRAY': {
      return {
        title: 'Not a Chest X-Ray',
        urgency: 'LOW',
        recommendation: 'The uploaded image does not appear to be a chest X-ray. Please upload a valid frontal (posteroanterior) or lateral chest radiograph for pneumonia analysis.',
        diagnosticTests: [],
        treatmentOptions: [
          'Upload a valid chest X-ray image',
          'Ensure image is in DICOM or standard image format'
        ],
        followUp: [
          'Resubmit with correct chest X-ray'
        ],
        warnings: [
          'Only chest X-rays can be analyzed',
          'Ensure the image shows the full chest cavity'
        ]
      };
    }
    
    default: {
      return {
        title: 'Analysis Result',
        urgency: baseUrgency,
        recommendation: 'Refer to clinical assessment and radiologist interpretation for definitive diagnosis and management.',
        diagnosticTests: [],
        treatmentOptions: [],
        followUp: [],
        warnings: []
      };
    }
  }
}