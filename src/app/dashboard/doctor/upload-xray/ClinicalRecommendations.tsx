import React from 'react';
import { motion } from 'framer-motion';
import type { ClinicalRecommendation } from './symptom-scoring';

interface ClinicalRecommendationsProps {
  recommendation: ClinicalRecommendation;
}

const ClinicalRecommendations: React.FC<ClinicalRecommendationsProps> = ({ recommendation }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'from-red-500 to-red-600';
      case 'HIGH':
        return 'from-orange-500 to-orange-600';
      case 'MODERATE':
        return 'from-yellow-500 to-yellow-600';
      case 'LOW':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200';
      case 'HIGH':
        return 'bg-orange-50 border-orange-200';
      case 'MODERATE':
        return 'bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'text-red-800';
      case 'HIGH':
        return 'text-orange-800';
      case 'MODERATE':
        return 'text-yellow-800';
      case 'LOW':
        return 'text-green-800';
      default:
        return 'text-gray-800';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return '🚨 CRITICAL';
      case 'HIGH':
        return '⚠️ HIGH PRIORITY';
      case 'MODERATE':
        return '⚡ MODERATE';
      case 'LOW':
        return '✓ LOW RISK';
      default:
        return urgency;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Urgency Header */}
      <div className={`border-l-4 rounded-lg p-6 ${getUrgencyBg(recommendation.urgency)}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-2xl font-bold ${getUrgencyText(recommendation.urgency)}`}>
            {recommendation.title}
          </h3>
          <span className={`px-4 py-2 rounded-full font-bold text-white bg-gradient-to-r ${getUrgencyColor(recommendation.urgency)}`}>
            {getUrgencyLabel(recommendation.urgency)}
          </span>
        </div>

        {/* Main Recommendation */}
        <div className={`p-4 rounded-lg ${getUrgencyBg(recommendation.urgency).split('border')[0]} bg-white border-2 ${getUrgencyBg(recommendation.urgency).split('border-')[1]}`}>
          <p className="text-gray-800 leading-relaxed font-medium">
            {recommendation.recommendation}
          </p>
        </div>
      </div>

      {/* Diagnostic Tests */}
      {recommendation.diagnosticTests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6"
        >
          <h4 className="flex items-center text-lg font-bold text-blue-900 mb-4">
            <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recommended Diagnostic Tests
          </h4>
          <ul className="space-y-2">
            {recommendation.diagnosticTests.map((test, idx) => (
              <li key={idx} className="flex items-start text-blue-800">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mt-2 mr-3 flex-shrink-0"></span>
                <span>{test}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Treatment Options */}
      {recommendation.treatmentOptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-6"
        >
          <h4 className="flex items-center text-lg font-bold text-purple-900 mb-4">
            <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Treatment Options
          </h4>
          <ul className="space-y-2">
            {recommendation.treatmentOptions.map((option, idx) => (
              <li key={idx} className="flex items-start text-purple-800">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-600 mt-2 mr-3 flex-shrink-0"></span>
                <span>{option}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Follow-up Recommendations */}
      {recommendation.followUp.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6"
        >
          <h4 className="flex items-center text-lg font-bold text-green-900 mb-4">
            <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Follow-up Recommendations
          </h4>
          <ul className="space-y-2">
            {recommendation.followUp.map((followUp, idx) => (
              <li key={idx} className="flex items-start text-green-800">
                <span className="inline-block w-2 h-2 rounded-full bg-green-600 mt-2 mr-3 flex-shrink-0"></span>
                <span>{followUp}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Warnings/Alerts */}
      {recommendation.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={`border-l-4 rounded-lg p-6 ${
            recommendation.urgency === 'CRITICAL' 
              ? 'bg-red-50 border-red-500' 
              : 'bg-amber-50 border-amber-500'
          }`}
        >
          <h4 className={`flex items-center text-lg font-bold mb-4 ${
            recommendation.urgency === 'CRITICAL' 
              ? 'text-red-900' 
              : 'text-amber-900'
          }`}>
            <svg className={`w-6 h-6 mr-3 ${
              recommendation.urgency === 'CRITICAL' 
                ? 'text-red-600' 
                : 'text-amber-600'
            }`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Important Warnings
          </h4>
          <ul className="space-y-2">
            {recommendation.warnings.map((warning, idx) => (
              <li key={idx} className={`flex items-start ${
                recommendation.urgency === 'CRITICAL' 
                  ? 'text-red-800' 
                  : 'text-amber-800'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                  recommendation.urgency === 'CRITICAL' 
                    ? 'bg-red-600' 
                    : 'bg-amber-600'
                }`}></span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <strong>Disclaimer:</strong> This clinical recommendation is generated based on AI analysis of medical imaging and patient symptoms. 
          It is intended to support clinical decision-making but should not replace professional medical judgment. 
          A qualified healthcare provider should perform a comprehensive clinical evaluation and confirm the diagnosis before implementing treatment.
        </p>
      </div>
    </motion.div>
  );
};

export default ClinicalRecommendations;
