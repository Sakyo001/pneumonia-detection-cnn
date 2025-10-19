"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SymptomData, VitalSigns } from './symptom-scoring';

interface EnhancedPatientInfoFormProps {
  patientName: string;
  setPatientName: (v: string) => void;
  patientAge: string;
  setPatientAge: (v: string) => void;
  patientGender: string;
  setPatientGender: (v: string) => void;
  referenceNumber: string;
  patientNotes: string;
  setPatientNotes: (v: string) => void;
  medicalHistory: string;
  setMedicalHistory: (v: string) => void;
  // New props for symptom data
  symptomData: SymptomData;
  setSymptomData: (v: SymptomData) => void;
  regions: any[];
  selectedRegion: string;
  setSelectedRegion: (v: string) => void;
  selectedRegionCode: string;
  setSelectedRegionCode: (v: string) => void;
  cities: any[];
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  selectedCityCode: string;
  setSelectedCityCode: (v: string) => void;
  barangays: any[];
  selectedBarangay: string;
  setSelectedBarangay: (v: string) => void;
}

const EnhancedPatientInfoForm: React.FC<EnhancedPatientInfoFormProps> = ({
  patientName, setPatientName,
  patientAge, setPatientAge,
  patientGender, setPatientGender,
  referenceNumber,
  patientNotes, setPatientNotes,
  medicalHistory, setMedicalHistory,
  symptomData, setSymptomData,
  regions, selectedRegion, setSelectedRegion,
  selectedRegionCode, setSelectedRegionCode,
  cities, selectedCity, setSelectedCity,
  selectedCityCode, setSelectedCityCode,
  barangays, selectedBarangay, setSelectedBarangay
}) => {
  const [symptomSections, setSymptomSections] = useState({
    primary: true,
    secondary: false,
    vitals: true,
    characteristics: false,
    onset: true,
    associated: false,
    risks: false,
    covidSpecific: false,
    tbSpecific: false
  });

  const toggleSection = (section: keyof typeof symptomSections) => {
    setSymptomSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateSymptom = (key: keyof SymptomData, value: any) => {
    setSymptomData({ ...symptomData, [key]: value });
  };

  const updateVitalSign = (key: keyof VitalSigns, value: number | undefined) => {
    setSymptomData({
      ...symptomData,
      vitalSigns: { ...symptomData.vitalSigns, [key]: value }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Basic Patient Information */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Patient Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="patientName" className="block text-sm font-semibold text-gray-700 mb-2">
              Patient Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="patientName"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Enter patient name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="patientAge" className="block text-sm font-semibold text-gray-700 mb-2">
              Age
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="patientAge"
                type="number"
                value={patientAge}
                onChange={(e) => {
                  setPatientAge(e.target.value);
                  const age = parseInt(e.target.value);
                  if (!isNaN(age)) {
                    updateSymptom('age65Plus', age >= 65);
                    updateSymptom('ageUnder5', age < 5);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Years"
              />
            </div>
          </div>

          <div>
            <label htmlFor="patientGender" className="block text-sm font-semibold text-gray-700 mb-2">
              Gender
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <select
                id="patientGender"
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="referenceNumber" className="block text-sm font-semibold text-gray-700 mb-2">
              Reference Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <input
                id="referenceNumber"
                type="text"
                value={referenceNumber}
                readOnly
                className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 text-gray-700 font-medium border-indigo-200 rounded-xl focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                const region = regions.find(r => r.name === e.target.value);
                setSelectedRegion(e.target.value);
                setSelectedRegionCode(region?.code || '');
                setSelectedCity('');
                setSelectedCityCode('');
                setSelectedBarangay('');
              }}
              className="w-full px-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region.code} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City/Municipality</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                const city = cities.find(c => c.name === e.target.value);
                setSelectedCity(e.target.value);
                setSelectedCityCode(city?.code || '');
                setSelectedBarangay('');
              }}
              disabled={!selectedRegion}
              className="w-full px-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city.code} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              disabled={!selectedCity}
              className="w-full px-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
            >
              <option value="">Select Barangay</option>
              {barangays.map((barangay) => (
                <option key={barangay.code} value={barangay.name}>
                  {barangay.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clinical Symptoms - Collapsible Sections */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Clinical Assessment</h3>
        </div>

        {/* Primary Symptoms */}
        <SymptomSection
          title="Primary Respiratory Symptoms"
          isOpen={symptomSections.primary}
          onToggle={() => toggleSection('primary')}
          icon="🫁"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CheckboxField
              label="Fever"
              checked={symptomData.fever}
              onChange={(checked) => updateSymptom('fever', checked)}
            />
            <CheckboxField
              label="Persistent Cough"
              checked={symptomData.persistentCough}
              onChange={(checked) => updateSymptom('persistentCough', checked)}
            />
            <CheckboxField
              label="Chest Pain"
              checked={symptomData.chestPain}
              onChange={(checked) => updateSymptom('chestPain', checked)}
            />
            <CheckboxField
              label="Difficulty Breathing"
              checked={symptomData.difficultyBreathing}
              onChange={(checked) => updateSymptom('difficultyBreathing', checked)}
            />
          </div>
        </SymptomSection>

        {/* Vital Signs */}
        <SymptomSection
          title="Vital Signs"
          isOpen={symptomSections.vitals}
          onToggle={() => toggleSection('vitals')}
          icon="📊"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberField
              label="Temperature (°C)"
              value={symptomData.vitalSigns?.temperature}
              onChange={(val) => updateVitalSign('temperature', val)}
              placeholder="e.g., 38.5"
              step={0.1}
            />
            <NumberField
              label="Oxygen Saturation (%)"
              value={symptomData.vitalSigns?.oxygenSaturation}
              onChange={(val) => updateVitalSign('oxygenSaturation', val)}
              placeholder="e.g., 95"
              min={0}
              max={100}
            />
            <NumberField
              label="Heart Rate (bpm)"
              value={symptomData.vitalSigns?.heartRate}
              onChange={(val) => updateVitalSign('heartRate', val)}
              placeholder="e.g., 80"
            />
            <NumberField
              label="Respiratory Rate (breaths/min)"
              value={symptomData.vitalSigns?.respiratoryRate}
              onChange={(val) => updateVitalSign('respiratoryRate', val)}
              placeholder="e.g., 18"
            />
          </div>
        </SymptomSection>

        {/* Cough & Sputum Characteristics */}
        <SymptomSection
          title="Cough & Sputum Characteristics"
          isOpen={symptomSections.characteristics}
          onToggle={() => toggleSection('characteristics')}
          icon="🔬"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxField
                label="Productive Cough (with phlegm)"
                checked={symptomData.productiveCough}
                onChange={(checked) => updateSymptom('productiveCough', checked)}
              />
              <CheckboxField
                label="Dry Hacking Cough"
                checked={symptomData.dryHackingCough}
                onChange={(checked) => updateSymptom('dryHackingCough', checked)}
              />
            </div>
            
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Sputum Color/Type:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CheckboxField
                  label="Clear/White Sputum"
                  checked={symptomData.clearSputum}
                  onChange={(checked) => updateSymptom('clearSputum', checked)}
                />
                <CheckboxField
                  label="Yellow/Green Sputum"
                  checked={symptomData.yellowGreenSputum}
                  onChange={(checked) => updateSymptom('yellowGreenSputum', checked)}
                />
                <CheckboxField
                  label="Blood in Sputum"
                  checked={symptomData.bloodInSputum}
                  onChange={(checked) => updateSymptom('bloodInSputum', checked)}
                />
              </div>
            </div>

            <NumberField
              label="Cough Duration (days)"
              value={symptomData.coughDuration}
              onChange={(val) => updateSymptom('coughDuration', val)}
              placeholder="e.g., 5"
            />
          </div>
        </SymptomSection>

        {/* Onset & Duration */}
        <SymptomSection
          title="Symptom Onset & Duration"
          isOpen={symptomSections.onset}
          onToggle={() => toggleSection('onset')}
          icon="⏱️"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxField
                label="Sudden Onset (within hours to 1 day)"
                checked={symptomData.suddenOnset}
                onChange={(checked) => {
                  updateSymptom('suddenOnset', checked);
                  if (checked) updateSymptom('gradualOnset', false);
                }}
              />
              <CheckboxField
                label="Gradual Onset (over several days)"
                checked={symptomData.gradualOnset}
                onChange={(checked) => {
                  updateSymptom('gradualOnset', checked);
                  if (checked) updateSymptom('suddenOnset', false);
                }}
              />
            </div>
            
            <NumberField
              label="Total Symptom Duration (days)"
              value={symptomData.symptomDuration}
              onChange={(val) => updateSymptom('symptomDuration', val)}
              placeholder="e.g., 7"
            />
          </div>
        </SymptomSection>

        {/* Associated Symptoms */}
        <SymptomSection
          title="Associated Symptoms"
          isOpen={symptomSections.associated}
          onToggle={() => toggleSection('associated')}
          icon="🩺"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CheckboxField
              label="Fatigue/Weakness"
              checked={symptomData.fatigue}
              onChange={(checked) => updateSymptom('fatigue', checked)}
            />
            <CheckboxField
              label="Rapid Breathing"
              checked={symptomData.rapidBreathing}
              onChange={(checked) => updateSymptom('rapidBreathing', checked)}
            />
            <CheckboxField
              label="Crackling/Rales Sounds"
              checked={symptomData.cracklingSounds}
              onChange={(checked) => updateSymptom('cracklingSounds', checked)}
            />
            <CheckboxField
              label="Muscle Aches"
              checked={symptomData.muscleAches}
              onChange={(checked) => updateSymptom('muscleAches', checked)}
            />
            <CheckboxField
              label="Chills and Shaking"
              checked={symptomData.chillsAndShaking}
              onChange={(checked) => updateSymptom('chillsAndShaking', checked)}
            />
            <CheckboxField
              label="Headache"
              checked={symptomData.headache}
              onChange={(checked) => updateSymptom('headache', checked)}
            />
            <CheckboxField
              label="Sore Throat"
              checked={symptomData.soreThroat}
              onChange={(checked) => updateSymptom('soreThroat', checked)}
            />
            <CheckboxField
              label="Nausea/Vomiting"
              checked={symptomData.nauseaVomiting}
              onChange={(checked) => updateSymptom('nauseaVomiting', checked)}
            />
            <CheckboxField
              label="Confusion (especially elderly)"
              checked={symptomData.confusion}
              onChange={(checked) => updateSymptom('confusion', checked)}
            />
          </div>
        </SymptomSection>

        {/* Risk Factors */}
        <SymptomSection
          title="Risk Factors & Medical History"
          isOpen={symptomSections.risks}
          onToggle={() => toggleSection('risks')}
          icon="⚠️"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CheckboxField
              label="Recent Cold/Flu"
              checked={symptomData.recentColdFlu}
              onChange={(checked) => updateSymptom('recentColdFlu', checked)}
            />
            <CheckboxField
              label="Weakened Immune System"
              checked={symptomData.weakenedImmuneSystem}
              onChange={(checked) => updateSymptom('weakenedImmuneSystem', checked)}
            />
            <CheckboxField
              label="Smoker"
              checked={symptomData.smoker}
              onChange={(checked) => updateSymptom('smoker', checked)}
            />
            <CheckboxField
              label="Chronic Lung Disease (COPD, Asthma)"
              checked={symptomData.chronicLungDisease}
              onChange={(checked) => updateSymptom('chronicLungDisease', checked)}
            />
            <CheckboxField
              label="Heart Disease"
              checked={symptomData.heartDisease}
              onChange={(checked) => updateSymptom('heartDisease', checked)}
            />
            <CheckboxField
              label="Diabetes"
              checked={symptomData.diabetes}
              onChange={(checked) => updateSymptom('diabetes', checked)}
            />
          </div>
        </SymptomSection>

        {/* COVID-19 Specific Symptoms */}
        <SymptomSection
          title="COVID-19 Specific Indicators"
          isOpen={symptomSections.covidSpecific}
          onToggle={() => toggleSection('covidSpecific')}
          icon="🦠"
        >
          <div className="space-y-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-yellow-800 font-semibold">
                These symptoms are highly specific to COVID-19 and warrant immediate testing
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxField
                label="Loss of Taste or Smell (80% specific to COVID)"
                checked={symptomData.lossOfTasteSmell || false}
                onChange={(checked) => updateSymptom('lossOfTasteSmell', checked)}
              />
              <CheckboxField
                label="Known COVID-19 Exposure/Contact"
                checked={symptomData.knownCovidExposure || false}
                onChange={(checked) => updateSymptom('knownCovidExposure', checked)}
              />
              <CheckboxField
                label="Sudden Severe Breathing Difficulty"
                checked={symptomData.suddenSevereBreathing || false}
                onChange={(checked) => updateSymptom('suddenSevereBreathing', checked)}
              />
            </div>
            <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
              <p className="text-xs text-yellow-900">
                <strong>Note:</strong> If any of these are checked, the system will recommend COVID-19 PCR testing regardless of X-ray findings.
              </p>
            </div>
          </div>
        </SymptomSection>

        {/* TB Specific Symptoms */}
        <SymptomSection
          title="Tuberculosis (TB) Specific Indicators"
          isOpen={symptomSections.tbSpecific}
          onToggle={() => toggleSection('tbSpecific')}
          icon="🔬"
        >
          <div className="space-y-3 bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-800 font-semibold">
                These symptoms are highly suspicious for TB and require immediate workup
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckboxField
                label="Night Sweats (drenching, requiring clothing change)"
                checked={symptomData.nightSweats || false}
                onChange={(checked) => updateSymptom('nightSweats', checked)}
              />
              <CheckboxField
                label="Unintentional Weight Loss"
                checked={symptomData.weightLoss || false}
                onChange={(checked) => updateSymptom('weightLoss', checked)}
              />
              <CheckboxField
                label="Coughing Blood (Hemoptysis)"
                checked={symptomData.hemoptysis || false}
                onChange={(checked) => updateSymptom('hemoptysis', checked)}
              />
              <CheckboxField
                label="Chronic Cough (>3 weeks)"
                checked={symptomData.chronicCough || false}
                onChange={(checked) => updateSymptom('chronicCough', checked)}
              />
              <NumberField
                label="Cough Duration (weeks)"
                value={symptomData.chronicCoughWeeks}
                onChange={(val) => updateSymptom('chronicCoughWeeks', val)}
                placeholder="e.g., 4"
                min={0}
              />
              <CheckboxField
                label="Travel to TB-Endemic Area"
                checked={symptomData.travelToTBEndemicArea || false}
                onChange={(checked) => updateSymptom('travelToTBEndemicArea', checked)}
              />
              <CheckboxField
                label="HIV+ or Immunocompromised"
                checked={symptomData.hivPositiveOrImmunocompromised || false}
                onChange={(checked) => updateSymptom('hivPositiveOrImmunocompromised', checked)}
              />
              <CheckboxField
                label="Close Contact with TB Patient"
                checked={symptomData.closeContactWithTBPatient || false}
                onChange={(checked) => updateSymptom('closeContactWithTBPatient', checked)}
              />
            </div>
            <div className="mt-3 p-3 bg-red-100 rounded-lg">
              <p className="text-xs text-red-900">
                <strong>Critical:</strong> If multiple TB indicators are present, immediate respiratory isolation, sputum AFB smear, and GeneXpert testing will be recommended regardless of X-ray findings.
              </p>
            </div>
          </div>
        </SymptomSection>
      </div>

      {/* Clinical Notes */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Clinical Notes</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Clinical Notes
            </label>
            <textarea
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              placeholder="Any additional observations, symptoms, or relevant clinical information..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Past Medical History
            </label>
            <textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              placeholder="Relevant past illnesses, chronic conditions, previous pneumonia episodes, allergies, medications, etc."
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper Components
const SymptomSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: string;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, icon, children }) => {
  return (
    <div className="border-b border-gray-200 last:border-0 pb-4 mb-4 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 px-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
};

const NumberField: React.FC<{
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, placeholder, min, max, step }) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full px-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
      />
    </div>
  );
};

export default EnhancedPatientInfoForm;
