import React from 'react';

interface PrintOnlyReportProps {
  analysisResult: any;
  doctorInfo: any;
  printDate: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientNotes: string;
  patientLocation: string;
  previewUrl: string | null;
  medicalHistory?: string;
  reportedSymptoms?: string[];
  customSymptom?: string;
}

const getUserFriendlyPrediction = (prediction: string) => {
  switch (prediction) {
    case 'NON_XRAY': return 'Not a Chest X-Ray';
    case 'COVID': return 'COVID-19';
    case 'TB': return 'Tuberculosis';
    case 'BACTERIAL_PNEUMONIA': return 'Bacterial Pneumonia';
    case 'VIRAL_PNEUMONIA': return 'Viral Pneumonia';
    case 'NORMAL': return 'Normal';
    default: return prediction || '---';
  }
};

const PrintOnlyReport: React.FC<PrintOnlyReportProps> = ({
  analysisResult,
  doctorInfo,
  printDate,
  patientName,
  patientAge,
  patientGender,
  patientNotes,
  patientLocation,
  previewUrl,
  medicalHistory,
  reportedSymptoms,
  customSymptom
}) => (
  <div className="print-only hidden">
    <div className="mx-auto max-w-4xl text-gray-900 p-4">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{doctorInfo?.hospital || 'Medical Center'}</h1>
          <p className="text-sm">{doctorInfo?.department}</p>
        </div>
        <div className="text-right">
          <p><strong>Date:</strong> {printDate || '---'}</p>
          <p><strong>Reference:</strong> {analysisResult?.referenceNumber || '---'}</p>
        </div>
      </div>

      {/* Patient Info */}
      <div className="mb-4">
        <h2 className="font-bold text-lg mb-2">Patient Information</h2>
        <p><strong>Name:</strong> {patientName}</p>
        <p><strong>Age:</strong> {patientAge} years</p>
        <p><strong>Gender:</strong> {patientGender}</p>
        {patientLocation && <p><strong>Location:</strong> {patientLocation}</p>}
        {patientNotes && <p><strong>Clinical Notes:</strong> {patientNotes}</p>}
      </div>

      {/* X-Ray Image */}
      {previewUrl && (
        <div className="mb-4 text-center">
          <h3 className="font-bold mb-1">Chest X-Ray Image</h3>
          <div className="border border-gray-300 p-2 inline-block">
            <img
              src={previewUrl}
              alt="Chest X-Ray"
              className="max-h-[300px] max-w-full"
            />
          </div>
        </div>
      )}

      {/* Diagnosis */}
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-1">Diagnosis</h3>
        <p>
          <strong>Finding:</strong> {getUserFriendlyPrediction(analysisResult?.prediction)}
          {analysisResult?.confidence && ` (${analysisResult.confidence}% confidence)`}
        </p>

        {/* Pneumonia-specific info */}
        {['BACTERIAL_PNEUMONIA', 'VIRAL_PNEUMONIA'].includes(analysisResult?.prediction) && (
          <>
            <p><strong>Type:</strong> {getUserFriendlyPrediction(analysisResult.prediction)}</p>
            <p><strong>Severity:</strong> {analysisResult.severity || 'Moderate'}</p>
          </>
        )}
      </div>

      {/* Clinical Assessment */}
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-1">Clinical Assessment</h3>
        
        {/* Primary Diagnosis */}
        <div className="mb-3">
          <p className="font-medium">
            <strong>Primary Finding:</strong> {getUserFriendlyPrediction(analysisResult?.prediction)}
            {analysisResult?.confidence && ` (${analysisResult.confidence}% confidence)`}
          </p>
        </div>

        {/* Severity Assessment */}
        {analysisResult?.severity && (
          <div className="mb-3">
            <p><strong>Severity:</strong> {analysisResult.severity}</p>
            {analysisResult?.severityDescription && (
              <p className="text-sm text-gray-700 mt-1">{analysisResult.severityDescription}</p>
            )}
          </div>
        )}

        {/* Pneumonia-specific Clinical Details */}
        {['BACTERIAL_PNEUMONIA', 'VIRAL_PNEUMONIA'].includes(analysisResult?.prediction) && (
          <div className="mb-3">
            <p><strong>Type:</strong> {getUserFriendlyPrediction(analysisResult.prediction)}</p>
            
            {/* Characteristics based on type */}
            <div className="mt-2 text-sm text-gray-700">
              <p><strong>Radiographic Characteristics:</strong></p>
              <p className="ml-4">
                {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                  ? 'Lobar consolidation with distinct borders, homogeneous opacification, air bronchograms, possible pleural effusion'
                  : 'Bilateral patchy infiltrates, ground-glass opacities, interstitial thickening, peribronchovascular distribution'}
              </p>
            </div>

            {/* Common Pathogens */}
            <div className="mt-2 text-sm text-gray-700">
              <p><strong>Common Pathogens:</strong></p>
              <p className="ml-4">
                {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                  ? 'Streptococcus pneumoniae, Haemophilus influenzae, Staphylococcus aureus, Klebsiella pneumoniae'
                  : 'Influenza virus, RSV, COVID-19, adenovirus, parainfluenza virus'}
              </p>
            </div>

            {/* Onset Pattern */}
            <div className="mt-2 text-sm text-gray-700">
              <p><strong>Typical Onset:</strong></p>
              <p className="ml-4">
                {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                  ? 'Sudden onset with high fever, chills, productive cough. Rapid progression over 24-48 hours'
                  : 'Gradual onset with mild to moderate symptoms. May have prodromal viral symptoms'}
              </p>
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {analysisResult?.recommendedAction && (
          <div className="mb-3">
            <p><strong>Recommended Action:</strong></p>
            <p className="text-sm text-gray-700 mt-1">{analysisResult.recommendedAction}</p>
          </div>
        )}

        {/* Treatment Considerations */}
        {['BACTERIAL_PNEUMONIA', 'VIRAL_PNEUMONIA'].includes(analysisResult?.prediction) && (
          <div className="mb-3">
            <p><strong>Treatment Considerations:</strong></p>
            <p className="text-sm text-gray-700 mt-1">
              {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                ? 'Immediate antibiotic treatment recommended. Start empiric therapy with amoxicillin-clavulanate or doxycycline. Consider hospital admission for severe cases. Monitor response within 48-72 hours.'
                : 'Supportive care including rest, hydration, and fever management. Consider antiviral therapy if influenza suspected. Monitor for secondary bacterial infection.'}
            </p>
          </div>
        )}

        {/* CURB-65 Assessment for Pneumonia */}
        {['BACTERIAL_PNEUMONIA', 'VIRAL_PNEUMONIA'].includes(analysisResult?.prediction) && (
          <div className="mb-3">
            <p><strong>CURB-65 Risk Assessment:</strong></p>
            <p className="text-sm text-gray-700 mt-1">
              Evaluate for: Confusion, Urea &gt; 7 mmol/L, Respiratory rate ≥ 30/min, Blood pressure &lt; 90/60, Age ≥ 65.
              Score 0-1: Outpatient treatment. Score 2: Consider hospital stay. Score 3-5: Hospitalize.
            </p>
          </div>
        )}
      </div>

      {/* Holistic Medical View */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2">Holistic Medical View</h3>

        {/* Reported Symptoms */}
        {(reportedSymptoms?.length || customSymptom) && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-1">Reported Symptoms</p>
            <div className="flex flex-wrap gap-2">
              {(reportedSymptoms || []).map(symptom => (
                <span key={symptom} className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                  {symptom}
                </span>
              ))}
              {customSymptom && (
                <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                  {customSymptom}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Medical History */}
        {medicalHistory && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-1">Medical History</p>
            <p className="text-sm text-gray-800">{medicalHistory}</p>
          </div>
        )}
      </div>

      {/* Doctor Signature */}
      <div className="mt-12">
        <div className="w-56 border-b border-black" style={{ minHeight: '30px' }}></div>
        <p className="text-sm text-gray-500 mb-1">Doctor's Signature</p>
        <p className="font-bold mt-1">{doctorInfo?.name}</p>
        <p>{doctorInfo?.title}</p>
      </div>

      {/* Footer */}
      <div className="text-center text-sm mt-8 pt-4 border-t">
        <p>{doctorInfo?.hospital} | {doctorInfo?.department}</p>
        <p>© {new Date().getFullYear()} MedRecord Hub. All rights reserved.</p>
      </div>
    </div>

    {/* Print-only style */}
    <style>{`
      @media print {
        body * {
          visibility: hidden;
        }
        .print-only, .print-only * {
          visibility: visible;
        }
        .print-only {
          position: absolute;
          top: 0;
          left: 0;
          padding: 2rem;
          width: 100%;
          background-color: white;
        }
      }
    `}</style>
  </div>
);

export default PrintOnlyReport;
