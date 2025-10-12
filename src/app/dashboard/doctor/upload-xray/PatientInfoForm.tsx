import React from 'react';
import { motion } from 'framer-motion';

interface PatientInfoFormProps {
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
  reportedSymptoms: string[];
  setReportedSymptoms: (v: string[]) => void;
  customSymptom: string;
  setCustomSymptom: (v: string) => void;
  commonSymptoms: string[];
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

const PatientInfoForm: React.FC<PatientInfoFormProps> = ({
  patientName, setPatientName,
  patientAge, setPatientAge,
  patientGender, setPatientGender,
  referenceNumber,
  patientNotes, setPatientNotes,
  medicalHistory, setMedicalHistory,
  reportedSymptoms, setReportedSymptoms,
  customSymptom, setCustomSymptom,
  commonSymptoms,
  regions, selectedRegion, setSelectedRegion,
  selectedRegionCode, setSelectedRegionCode,
  cities, selectedCity, setSelectedCity,
  selectedCityCode, setSelectedCityCode,
  barangays, selectedBarangay, setSelectedBarangay
}) => (
  <div className="space-y-6">
    {/* Reference Number Badge */}
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Reference Number</span>
        <div className="flex items-center gap-2">
          <code className="text-lg font-bold bg-white px-4 py-2 rounded-lg text-indigo-600 border border-indigo-200 shadow-sm">
            {referenceNumber}
          </code>
        </div>
      </div>
    </div>

    {/* Patient Name */}
    <div>
      <label htmlFor="patientName" className="block text-sm font-semibold text-gray-700 mb-2">
        Patient Name <span className="text-red-500">*</span>
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
          placeholder="Enter patient's full name"
          required
          key="patient-name-input"
        />
      </div>
    </div>

    {/* Age and Gender */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            onChange={(e) => setPatientAge(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder="Years"
            key="patient-age-input"
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
            key="patient-gender-select"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="referenceNumber" className="block text-sm font-semibold text-gray-800 mb-2">
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
            key="reference-number-input"
          />
        </div>
      </div>
      <div>
        <label htmlFor="patientNotes" className="block text-sm font-semibold text-gray-800 mb-2">
          Clinical Notes
        </label>
        <div className="relative">
          <div className="absolute top-3 left-0 pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <textarea
            id="patientNotes"
            value={patientNotes}
            onChange={(e) => setPatientNotes(e.target.value)}
            rows={4}
            className="w-full pl-10 pr-4 py-3 border-2 text-gray-700 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            placeholder="Any symptoms or relevant medical history..."
            key="patient-notes-textarea"
          />
        </div>
      </div>
      <div>
        <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">
          Medical History
        </label>
        <textarea
          id="medicalHistory"
          value={medicalHistory}
          onChange={(e) => setMedicalHistory(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Relevant past illnesses, chronic conditions, allergies, etc."
          key="medical-history-textarea"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reported Symptoms
        </label>
        <div className="relative">
          <select
            multiple
            value={reportedSymptoms}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              setReportedSymptoms(selectedOptions);
            }}
            className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
            key="symptoms-select"
          >
            {commonSymptoms.map((symptom) => (
              <option key={symptom} value={symptom}>
                {symptom}
              </option>
            ))}
            <option value="Other">Other (specify below)</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Hold Ctrl (or Cmd on Mac) to select multiple symptoms
          </div>
        </div>
        
        {/* Custom symptom input */}
        {reportedSymptoms.includes("Other") && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specify Other Symptom
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="Enter custom symptom..."
                className="flex-1 px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customSymptom.trim()) {
                    const newSymptoms = [...reportedSymptoms.filter((s: string) => s !== "Other"), customSymptom.trim()];
                    setReportedSymptoms(newSymptoms);
                    setCustomSymptom("");
                  }
                }}
                disabled={!customSymptom.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Add
              </button>
            </div>
          </div>
        )}
        
        {reportedSymptoms.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Selected symptoms:</div>
            <div className="flex flex-wrap gap-1">
              {reportedSymptoms.map((symptom) => (
                <span
                  key={symptom}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {symptom}
                  <button
                    type="button"
                    onClick={() => {
                      const newSymptoms = reportedSymptoms.filter((s: string) => s !== symptom);
                      setReportedSymptoms(newSymptoms);
                    }}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
        <select
          className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedRegionCode}
          onChange={e => {
            const code = e.target.value;
            setSelectedRegionCode(code);
            const region = regions.find((r: any) => r.code === code);
            setSelectedRegion(region ? region.name : "");
            setSelectedCity("");
            setSelectedCityCode("");
            setSelectedBarangay("");
          }}
          key="region-select"
        >
          <option value="">Select Region</option>
          {regions.map((region: any) => (
            <option key={region.code} value={region.code}>{region.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City / Municipality</label>
        <select
          className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedCityCode}
          onChange={e => {
            const code = e.target.value;
            setSelectedCityCode(code);
            const city = cities.find((c: any) => c.code === code);
            setSelectedCity(city && city.name ? city.name : "");
            setSelectedBarangay("");
          }}
          disabled={!selectedRegionCode}
          key="city-select"
        >
          <option value="">{selectedRegionCode ? "Select City/Municipality" : "Select Region first"}</option>
          {cities.map((city: any) => (
            <option key={city.code} value={city.code}>{city.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
        <select
          className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedBarangay}
          onChange={e => setSelectedBarangay(e.target.value)}
          disabled={!selectedCityCode}
          key="barangay-select"
        >
          <option value="">{selectedCityCode ? "Select Barangay" : "Select City first"}</option>
          {barangays.map((brgy: any) => (
            <option key={brgy.code} value={brgy.name}>{brgy.name}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

export default PatientInfoForm; 