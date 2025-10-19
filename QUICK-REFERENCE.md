# Quick Reference Guide: PDF Upload & Clinical Recommendations

## 🚀 Quick Start

### For End Users (Doctors)
1. **Upload X-Ray or PDF:**
   - Click "Choose File" or drag & drop
   - Select image (PNG, JPG, JPEG - max 10MB) OR PDF (max 50MB)
   - Preview appears with checkmark badge
   - Click "Remove & Choose New" to change file

2. **Enter Patient Information:**
   - Patient name, age, gender (required)
   - Medical history (optional but recommended for better recommendations)
   - Select symptoms from comprehensive form
   - Fill vital signs if available

3. **Submit for Analysis:**
   - Click "Upload & Analyze"
   - System processes file and returns diagnosis

4. **Review Clinical Recommendations:**
   - Navigate through 4 steps of analysis
   - Step 4 shows color-coded clinical recommendations
   - Review diagnostic tests, treatments, follow-up
   - Print or save report

---

## 📁 File Structure

```
src/app/dashboard/doctor/upload-xray/
├── page.tsx                          # Main page (file handlers added)
├── XrayUploadSection.tsx             # File upload UI (PDF support)
├── AnalysisResultDisplay.tsx         # Results display (recommendations integrated)
├── ClinicalRecommendations.tsx       # ✨ NEW: Recommendations component
├── actions.ts                        # Server action (PDF validation)
├── symptom-scoring.ts                # Scoring logic (generateClinicalRecommendations added)
├── PatientInfoForm.tsx               # Patient info form
├── EnhancedPatientInfoForm.tsx        # Symptom collection form
├── PrintOnlyReport.tsx               # Print layout
├── XrayUploadSection.tsx             # Upload component
├── AnalysisResultDisplay.tsx         # Results component
└── parse-output.ts                   # Utility functions
```

---

## 🎨 Color Coding Guide

### Urgency Levels
| Level | Color | Usage |
|-------|-------|-------|
| 🚨 CRITICAL | Red (from-red-500) | TB, COVID with high risk, respiratory distress |
| ⚠️ HIGH | Orange (from-orange-500) | Bacterial pneumonia in elderly/high-risk |
| ⚡ MODERATE | Yellow (from-yellow-500) | Viral pneumonia, symptomatic normal CXR |
| ✓ LOW | Green (from-green-500) | Normal findings, low-risk |

### Section Colors
| Section | Color | Meaning |
|---------|-------|---------|
| Diagnostic Tests | Blue (from-blue-500) | Information to collect |
| Treatment | Purple (from-purple-500) | Actions to take |
| Follow-up | Green (from-green-500) | Monitoring plan |
| Warnings | Red/Amber | Critical alerts |

---

## 💊 Common Drug Recommendations

### Bacterial Pneumonia (Typical)
```
First-line:
- Amoxicillin-clavulanate 875/125mg BID
- OR Doxycycline 100mg BID × 5-7 days

Alternative:
- Azithromycin 500mg daily × 3 days
- OR Clarithromycin 500mg BID

Severe/Hospitalized:
- Ceftriaxone 1-2g daily IV
- OR Fluoroquinolone IV
```

### Viral Pneumonia (Typical)
```
Supportive Care:
- Acetaminophen 500-1000mg Q4-6H
- OR Ibuprofen 400-600mg Q6H
- Rest, hydration

Antiviral (if influenza, within 48h):
- Oseltamivir (Tamiflu) 75mg BID × 5 days
```

### TB (Intensive Phase)
```
RIPE Regimen - First 2 months:
- Isoniazid (INH) 300mg daily
- Rifampin (RIF) 600mg daily
- Pyrazinamide (PZA) 25mg/kg daily
- Ethambutol (EMB) 25mg/kg daily

Then Continuation Phase - 4 months:
- Isoniazid + Rifampin only
```

---

## ✅ Diagnostic Tests Typically Ordered

### For Bacterial Pneumonia
- [ ] Complete blood count (CBC) with differential
- [ ] Blood cultures (before antibiotics!)
- [ ] Sputum gram stain & culture
- [ ] Pulse oximetry or ABG if SpO2 < 92%
- [ ] CRP and procalcitonin
- [ ] Comprehensive metabolic panel (if hospitalized)

### For Viral Pneumonia
- [ ] Respiratory pathogen PCR panel
- [ ] CBC
- [ ] Blood cultures (if deterioration)
- [ ] Pulse oximetry

### For COVID-19 Suspected
- [ ] **COVID-19 PCR** (nasopharyngeal or oropharyngeal) - REQUIRED!
- [ ] Chest CT (if X-ray unclear)
- [ ] D-dimer (if concerned for PE)
- [ ] Troponin (if cardiac involvement suspected)

### For TB Suspected
- [ ] **Sputum AFB smear** - PRIORITY
- [ ] **GeneXpert MTB/RIF** - REQUIRED
- [ ] TB culture
- [ ] HIV test (TB-HIV coinfection)
- [ ] TB skin test or IGRA

---

## ⏱️ Follow-up Timeline

### Bacterial Pneumonia
- **24-48 hours:** Contact elderly or high-risk patients
- **48-72 hours:** Clinical reassessment (all patients)
- **4-6 weeks:** Follow-up chest X-ray to confirm resolution

### Viral Pneumonia
- **3-5 days:** Clinical assessment
- **Not improving?** Consider hospital admission or imaging

### Normal CXR but Symptomatic
- **24-48 hours:** Repeat CXR if symptoms persist
- **Follow-up:** If no improvement, consider other diagnoses

### COVID-19
- **Urgent:** PCR testing (same day if possible)
- **Isolation:** Immediate if positive
- **7-10 days:** Repeat imaging if hospitalized

### TB
- **Immediate:** Respiratory isolation, sputum AFB
- **2 weeks:** First sputum smear (check for conversion)
- **4 weeks:** Second sputum smear
- **2-3 months:** CXR to assess improvement

---

## 🔍 When to Hospitalize?

### RED FLAGS for Admission
- Respiratory rate > 30 breaths/min
- SpO2 < 92% on room air
- Altered mental status/confusion
- Systolic BP < 90 or diastolic < 60
- Temperature > 39°C with severe symptoms
- Hemoptysis (coughing blood)
- Signs of sepsis

### CURB-65 Score
```
1 point each for:
C - Confusion (new onset)
U - Urea > 7 mmol/L (19 mg/dL)
R - Respiratory rate ≥ 30/min
B - Blood pressure (SBP < 90 or DBP ≤ 60)
65 - Age ≥ 65 years

Score 0-1: Outpatient care
Score 2: Consider hospital
Score 3-5: Admit, consider ICU if 4-5
```

---

## 📞 Emergency Situations

### Call 911 / Emergency if:
- Severe difficulty breathing
- Chest pain
- Fainting or severe dizziness
- Coughing up large amounts of blood
- Severe confusion or altered mental status
- SpO2 < 88%

### TB Respiratory Isolation
- Place in negative pressure room immediately
- Staff wears N95 mask
- Maintain until:
  - On treatment × 2 weeks, AND
  - 3 negative sputum smears, AND
  - Clinical improvement

### COVID-19 Isolation
- Home isolation until fever-free × 24 hours without meds
- Then 5 more days with precautions
- Mask around others for up to 10 days

---

## 🛠️ Troubleshooting

### File Upload Not Working
**Problem:** Upload button doesn't respond  
**Solution:** 
- Check file type (must be image or PDF)
- Check file size (10MB for images, 50MB for PDF)
- Try different format (if PNG, try JPG)

### Recommendations Not Showing
**Problem:** Step 4 is blank  
**Solution:**
- Refresh page
- Check browser console for errors
- Ensure JavaScript is enabled

### Age/History Not Affecting Recommendations
**Problem:** Elderly patient not getting HIGH urgency  
**Solution:**
- Ensure age field is filled with number (not text)
- Check medical history contains keywords like "diabetes", "chronic", "heart"

### PDF Upload Fails
**Problem:** PDF rejected  
**Solution:**
- Check file is actually PDF (not renamed file)
- Ensure file < 50MB
- Try uploading smaller PDF or split into multiple files

---

## 📊 Data That Affects Recommendations

### Critical Fields
- Prediction (from AI model)
- Confidence score
- Patient age

### Important Fields
- Medical history (chronic conditions increase urgency)
- Symptoms (difficulty breathing increases urgency)
- Vital signs (low SpO2, high RR increase urgency)

### Optional Fields
- Gender (minor role in recommendations)
- Location (useful for context)
- Patient notes

---

## 🎯 Common Scenarios

### Scenario 1: 75-year-old with Bacterial Pneumonia (92% confidence)
```
Urgency: HIGH (elderly + high confidence)
Recommendations:
  - Hospitalization strongly recommended
  - IV antibiotics (ceftriaxone)
  - Daily clinical assessment
  - Comprehensive metabolic panel
Alert: CURB-65 scoring required
```

### Scenario 2: 28-year-old with Viral Pneumonia (85% confidence)
```
Urgency: MODERATE (young patient, moderate confidence)
Recommendations:
  - Outpatient supportive care OK
  - Oseltamivir if influenza & within 48h
  - Close monitoring for secondary infection
  - Follow-up in 3-5 days
Alert: Watch for bacterial superinfection
```

### Scenario 3: Patient with COVID Risk Factors (70% confidence, loss of taste/smell)
```
Urgency: HIGH (signature COVID symptom)
Recommendations:
  - COVID-19 PCR testing REQUIRED immediately
  - Isolation precautions
  - CT chest if X-ray findings unclear
Alert: CRITICAL - PCR must be done despite X-ray findings
```

### Scenario 4: Elderly Patient with TB Suspicious Findings (60% confidence)
```
Urgency: CRITICAL
Recommendations:
  - Respiratory isolation IMMEDIATELY
  - Sputum AFB and GeneXpert PRIORITY
  - HIV testing
  - TB drugs to start if high clinical suspicion
Alert: URGENT - Do NOT wait for all tests to start treatment
```

---

## 📱 Mobile Optimization

### Upload on Mobile
- Tap "Choose File" to open camera or file browser
- Drag & drop not available on mobile
- Recommendations display full-width (optimized for small screens)

### Viewing Recommendations
- Swipe through sections (easier than scroll)
- All text readable without zoom
- Print recommended for desktop viewing

---

## 🔐 Privacy & Security

### Data Handling
- Patient data encrypted in transit
- Medical records stored securely
- No data shared without consent
- Cloudinary HIPAA-compliant

### What to Document
- Document clinical correlation with AI findings
- Note any discrepancies between AI and clinical impression
- Keep copy of analysis for medical record
- Document treatment decisions made

---

## 📚 References & Guidelines

### Pneumonia Guidelines
- CDC Pneumonia Guidelines
- IDSA Community-Acquired Pneumonia Guidelines
- WHO Pneumonia Management

### TB Guidelines
- WHO TB Treatment Guidelines
- CDC TB Infection Control Guidelines
- National TB Program protocols

### COVID-19 Guidelines
- WHO COVID-19 Clinical Management
- CDC COVID-19 Treatment Guidance
- NIH COVID-19 Treatment Guidelines

---

## 🎓 Training & Certification

### Initial Training
- Review entire PDF-CLINICAL-RECOMMENDATIONS.md
- Practice with test cases
- Observe experienced provider
- Shadow peer review

### Ongoing Education
- Monthly case reviews
- Quarterly guideline updates
- Annual competency assessment
- Continuing medical education credits

---

**Version:** 1.0  
**Last Updated:** October 19, 2025  
**Status:** Ready for Clinical Use  

For detailed information, see: `PDF-CLINICAL-RECOMMENDATIONS.md`
