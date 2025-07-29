import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface AnalysisResultDisplayProps {
  analysisResult: any;
  currentStep: number;
  setCurrentStep: (n: number) => void;
  totalSteps: number;
  previewUrl: string | null;
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientNotes: string;
  reportedSymptoms: string[];
  resetForm: () => void;
}

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({
  analysisResult, currentStep, setCurrentStep, totalSteps, previewUrl, patientName, patientAge, patientGender, patientNotes, reportedSymptoms, resetForm
}) => {
  console.log("AnalysisResultDisplay received:", analysisResult);
  console.log("Prediction:", analysisResult?.prediction);
  console.log("Confidence:", analysisResult?.confidence);
  
  const validationOnlyResults = ["NON_XRAY", "COVID", "TB"];
  const isValidationOnly = validationOnlyResults.includes(analysisResult?.prediction || "");
  const pneumoniaResults = ["BACTERIAL_PNEUMONIA", "VIRAL_PNEUMONIA"];
  const isPneumonia = pneumoniaResults.includes(analysisResult?.prediction || "");
  const isNormal = analysisResult?.prediction === "NORMAL";
  
  console.log("isValidationOnly:", isValidationOnly);
  console.log("isPneumonia:", isPneumonia);
  console.log("isNormal:", isNormal);

  // Convert JSON keys to user-friendly strings
  const getUserFriendlyPrediction = (prediction: string) => {
    switch (prediction) {
      case "NON_XRAY": return "Not a Chest X-Ray";
      case "COVID": return "COVID-19";
      case "TB": return "Tuberculosis";
      case "BACTERIAL_PNEUMONIA": return "Bacterial Pneumonia";
      case "VIRAL_PNEUMONIA": return "Viral Pneumonia";
      case "NORMAL": return "Normal";
      default: return prediction;
    }
  };

  const getResultColor = () => {
    if (isValidationOnly) return "text-red-600";
    if (isPneumonia) return "text-red-600";
    if (isNormal) return "text-green-600";
    return "text-gray-600";
  };

  const getResultDescription = () => {
    const prediction = analysisResult?.prediction || "";
    if (prediction === "NON_XRAY") return "This image does not appear to be a chest X-ray.";
    if (prediction === "COVID") return "COVID-19 related findings detected.";
    if (prediction === "TB") return "Tuberculosis characteristics detected.";
    if (prediction === "BACTERIAL_PNEUMONIA") return "Bacterial pneumonia detected.";
    if (prediction === "VIRAL_PNEUMONIA") return "Viral pneumonia detected.";
    if (prediction === "NORMAL") return "Normal chest X-ray findings.";
    return "Analysis complete.";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Reanalyze button at the top for all result types */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={resetForm}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-md transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reanalyze
        </button>
      </div>

      {/* Content area with proper height constraints */}
      <div className="flex-1 overflow-hidden">
        {/* Validation Results */}
        {isValidationOnly && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-800">Validation Result</h3>
            </div>
            <p className="text-red-700 text-sm mb-4">{getResultDescription()}</p>
            <div className="bg-red-100 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-xs text-red-700">
                <strong>Note:</strong> This is a validation result and has not been saved to the database. 
                Only chest X-ray images with pneumonia or normal findings are stored for medical records.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetForm}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Upload New Image
              </button>
            </div>
          </div>
        )}

        {/* Normal Results */}
        {isNormal && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-green-800">Normal Findings</h3>
            </div>
            <p className="text-green-700 text-sm mb-4">No significant findings detected.</p>
            <div className="flex gap-2">
              <button
                onClick={resetForm}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                New Analysis
              </button>
            </div>
          </div>
        )}

        {/* Multi-step Pneumonia Display */}
        {isPneumonia && (
          <div className="flex flex-col">
            {/* Step indicator */}
            <div className="flex justify-between items-center mb-4">
              {Array.from({length: totalSteps}).map((_, index) => (
                <div 
                  key={index}
                  className={`h-2 rounded-full flex-grow mx-1 transition-colors duration-300 ${
                    index === currentStep ? 'bg-red-500' : 
                    index < currentStep ? 'bg-gray-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            
            {/* Step content with animations */}
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div 
                    key="diagnosis"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-800">Diagnosis</h4>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {getUserFriendlyPrediction(analysisResult?.prediction || "")}
                      </span>
                    </div>
                    
                    <motion.div 
                      className="h-2 w-full bg-gray-200 rounded-full mb-1"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <motion.div 
                        className="h-2 rounded-full bg-red-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${analysisResult?.confidence || 0}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </motion.div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Confidence: {analysisResult?.confidence || 0}%</span>
                      <span>Abnormal</span>
                    </div>
                    
                    <div className="mt-6 text-sm">
                      <p className="text-gray-700 mb-3">
                        Analysis indicates patterns consistent with pneumonia in this X-ray image. Further evaluation is recommended.
                      </p>
                      
                      <p className="text-gray-600">
                        Pneumonia is characterized by inflammation of the air sacs in one or both lungs, which may fill with fluid.
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {currentStep === 1 && (
                  <motion.div 
                    key="pneumonia-type"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-4">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Pneumonia Type</h4>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' ? 'bg-blue-500' : 'bg-purple-500'} mr-2`}></div>
                        <span className="text-gray-800 font-medium">{getUserFriendlyPrediction(analysisResult?.prediction || "")}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50 mb-4">
                      <h5 className="font-medium text-sm mb-2 text-indigo-700">Characteristics</h5>
                      <p className="text-sm text-gray-700 mb-3">
                        {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                          ? 'Bacterial pneumonia typically presents as a dense, lobar consolidation with distinct borders. It often affects a specific segment or lobe of the lung, showing homogeneous opacification with air bronchograms.' 
                          : 'Viral pneumonia typically appears as a diffuse interstitial pattern or ground glass opacities. It may present with a more patchy and bilateral distribution, often showing reticular or nodular patterns.'}
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <h6 className="text-xs font-medium mb-1 text-indigo-600">Common Pathogens</h6>
                          <p className="text-xs text-gray-600">
                            {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                              ? 'Streptococcus pneumoniae (most common), Haemophilus influenzae, Staphylococcus aureus, Klebsiella pneumoniae, Pseudomonas aeruginosa'
                              : 'Influenza virus, Respiratory Syncytial Virus (RSV), COVID-19, adenovirus, parainfluenza virus, human metapneumovirus'}
                          </p>
                        </div>
                        <div>
                          <h6 className="text-xs font-medium mb-1 text-indigo-600">Onset & Progression</h6>
                          <p className="text-xs text-gray-600">
                            {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                              ? 'Typically sudden onset with high fever, chills, and productive cough. Rapid progression over 24-48 hours.'
                              : 'Usually gradual onset with mild to moderate symptoms. May have prodromal viral symptoms before respiratory symptoms.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <h5 className="font-medium mb-2 text-indigo-700">Treatment Considerations</h5>
                      <p className="text-gray-700">
                        {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                          ? 'Bacterial pneumonia typically responds well to appropriate antibiotic therapy. Empiric treatment should cover typical pathogens (S. pneumoniae, H. influenzae) and atypical organisms. Treatment should be started promptly, especially in high-risk patients. Consider hospital admission for severe cases.' 
                          : 'Viral pneumonia often resolves with supportive care including rest, hydration, and fever management. Antiviral medications (oseltamivir for influenza) may be beneficial if started early. Monitor for secondary bacterial infection which may require antibiotics.'}
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {currentStep === 2 && (
                  <motion.div 
                    key="severity"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="text-lg font-medium text-gray-800 mb-3">Severity Assessment</h4>
                    
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 rounded-full mr-2 bg-yellow-500"></div>
                      <span className="text-yellow-600 font-medium">
                        Moderate Pneumonia
                      </span>
                    </div>
                    
                    <motion.div 
                      className="w-full bg-gray-200 h-2 rounded-full mb-4"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div 
                        className="h-2 rounded-full bg-yellow-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "66%" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </motion.div>
                    
                    <div className="text-xs text-gray-500 flex justify-between mb-4">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg mb-4">
                      <h5 className="font-medium text-sm mb-2 text-indigo-700">Clinical Assessment</h5>
                      <p className="text-sm text-gray-700">
                        {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' 
                          ? 'Bacterial pneumonia typically presents with lobar consolidation, air bronchograms, and pleural effusion. The infection is usually localized to one or more lobes of the lung. Look for homogeneous opacification, loss of lung volume, and possible cavitation in severe cases.'
                          : 'Viral pneumonia typically presents with bilateral, patchy infiltrates and ground-glass opacities. The infection is usually more diffuse compared to bacterial pneumonia. May show interstitial thickening, peribronchovascular distribution, and bilateral involvement.'}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2 text-indigo-700">CURB-65 Risk Assessment</h5>
                      <p className="text-xs text-gray-600 mb-2">The CURB-65 score helps assess the severity of pneumonia and the need for hospital admission:</p>
                      <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1 mb-3">
                        <li><strong>C</strong>onfusion (new onset)</li>
                        <li><strong>U</strong>rea &gt; 7 mmol/L (19 mg/dL)</li>
                        <li><strong>R</strong>espiratory rate ≥ 30 breaths/min</li>
                        <li><strong>B</strong>lood pressure (systolic &lt; 90 mmHg or diastolic ≤ 60 mmHg)</li>
                        <li><strong>65</strong> years of age or older</li>
                      </ul>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs text-blue-800 font-medium mb-1">Risk Stratification:</p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li><strong>Score 0-1:</strong> Low risk - Consider outpatient treatment</li>
                          <li><strong>Score 2:</strong> Moderate risk - Consider short hospital stay or supervised outpatient treatment</li>
                          <li><strong>Score 3-5:</strong> High risk - Hospitalize, consider ICU for score 4-5</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {currentStep === 3 && (
                  <motion.div 
                    key="recommendations"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Clinical Recommendations</h4>
                    
                    <div className="border-l-4 border-indigo-500 pl-3 mb-5">
                      <p className="text-gray-800 font-medium">Primary Recommendation</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA'
                          ? 'Immediate antibiotic treatment is recommended. Start empiric therapy with amoxicillin-clavulanate or doxycycline for outpatient treatment. Consider hospital admission for severe cases or high-risk patients. Monitor response within 48-72 hours.'
                          : 'Supportive care including rest, hydration, and fever management. Consider antiviral therapy (oseltamivir) if influenza is suspected and presenting within 48 hours. Monitor for secondary bacterial infection. Hospital admission may be needed for severe cases.'}
                      </p>
                    </div>
                    
                    <div className="space-y-4 mt-6">
                      <div>
                        <h5 className="font-medium text-sm mb-2 text-indigo-700">Additional Diagnostic Tests</h5>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          <li>Complete blood count with differential (WBC count, neutrophil percentage)</li>
                          <li>Blood cultures (before antibiotic administration if bacterial suspected)</li>
                          <li>Sputum Gram stain and culture (if productive cough)</li>
                          <li>Pulse oximetry or arterial blood gas analysis</li>
                          <li>CRP and procalcitonin levels (to guide antibiotic therapy)</li>
                          <li>Consider CT scan of the chest for complex cases</li>
                          <li>Influenza and COVID-19 testing if viral etiology suspected</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-2 text-indigo-700">Treatment Options</h5>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          {analysisResult?.prediction === 'BACTERIAL_PNEUMONIA' ? (
                            <>
                              <li><strong>Outpatient:</strong> Amoxicillin-clavulanate 875/125mg BID or doxycycline 100mg BID</li>
                              <li><strong>Alternative:</strong> Azithromycin 500mg daily for 3 days or clarithromycin 500mg BID</li>
                              <li><strong>Severe cases:</strong> Consider IV antibiotics and hospital admission</li>
                              <li><strong>Duration:</strong> 5-7 days for uncomplicated cases, 7-10 days for severe cases</li>
                            </>
                          ) : (
                            <>
                              <li><strong>Supportive care:</strong> Rest, hydration, antipyretics (acetaminophen/ibuprofen)</li>
                              <li><strong>Antiviral therapy:</strong> Oseltamivir 75mg BID for 5 days if influenza suspected</li>
                              <li><strong>Monitoring:</strong> Watch for secondary bacterial infection requiring antibiotics</li>
                              <li><strong>Severe cases:</strong> May require hospital admission for oxygen therapy</li>
                            </>
                          )}
                          <li><strong>Oxygen therapy:</strong> If SpO2 &lt; 92% or respiratory distress</li>
                          <li><strong>Follow-up:</strong> Clinical assessment within 48-72 hours</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-2 text-indigo-700">Follow-up Recommendations</h5>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          <li>Follow-up chest X-ray in 4-6 weeks to confirm resolution</li>
                          <li>Clinical assessment within 48-72 hours for high-risk patients</li>
                          <li>Patient education on preventing recurrence and recognizing worsening symptoms</li>
                          <li>Consider pneumococcal and influenza vaccination (if not previously vaccinated)</li>
                          <li>Smoking cessation counseling if applicable</li>
                          <li>Address underlying comorbidities that may have contributed</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Navigation controls */}
              <div className="flex justify-between mt-8">
                <button 
                  type="button"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className={`flex items-center text-sm font-medium ${currentStep === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex gap-2">
                  {(currentStep < totalSteps - 1) && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
                      className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Next
                      <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {currentStep === totalSteps - 1 && (
                    <button 
                      className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 px-3 rounded-md"
                      onClick={() => window.print()}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResultDisplay; 