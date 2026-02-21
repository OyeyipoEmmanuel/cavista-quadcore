# Clinical_Guidelines.md
Source: IMAI District Clinician Manual (WHO) — extracted from uploaded CLINISLOGIC.pdf
(Use these concise algorithms as grounding for the model in low-resource triage scenarios.)

------------------------------------------------------------
SECTION 0 — USAGE NOTES (how to inject into LLM)
------------------------------------------------------------
- Paste this file into the LLM system prompt (or attach as context files) to provide grounding.
- Keep each condition snippet short (6–15 lines) — the model uses rules/flowcharts more reliably than long prose.
- If asking the model for JSON output, explicitly instruct it to “ground in Clinical_Guidelines.md” and to return only the specified JSON keys.

------------------------------------------------------------
SECTION 1 — QUICK CHECK: EMERGENCY TRIAGE (high-signal)
------------------------------------------------------------
Perform Quick Check for all patients immediately:

A — Airway  
B — Breathing  
C — Circulation  
D — Disability (level of consciousness)  
E — External bleeding

Emergency signs (one or more → immediate stabilization & urgent referral):
- Severe respiratory distress or inability to protect airway  
- SpO₂ < 90% (if available)  
- Shock (SBP < 90 mmHg, poor perfusion, cold extremities)  
- Unresponsive / decreased level of consciousness  
- Severe external bleeding

Immediate actions if emergency sign present:
- Secure airway, give oxygen, establish IV access, control bleeding, urgent referral to higher-level care.  
(Reference: Quick Check / Emergency signs.)  
 

------------------------------------------------------------
SECTION 2 — RESPIRATORY TRIAGE: SEVERE PNEUMONIA & ACUTE RESPIRATORY ILLNESS
------------------------------------------------------------
Suspect severe pneumonia when:
- Fever or suspected infection AND cough AND (RR > 30 OR severe respiratory distress OR SpO₂ < 90%)

If severe pneumonia or acute respiratory compromise:
1. Manage airway immediately.  
2. Give oxygen and monitor SpO₂ continuously where possible.  
3. Start empirical IV antibiotics promptly (examples: ceftriaxone ± macrolide OR ampicillin + gentamicin + macrolide per local guidance).  
4. Conservative fluid management (avoid fluid overload that worsens oxygenation).  
5. Escalate/transfer if oxygenation worsens or SpO₂ remains < 90% despite oxygen.  

If no severe signs but cough + fever:
- Use age-specific RR to decide outpatient vs. priority referral. Provide safety-netting.  
(Reference: Severe pneumonia flowcharts and management steps.)  
 

------------------------------------------------------------
SECTION 3 — SHOCK MANAGEMENT (district clinician steps)
------------------------------------------------------------
Recognize shock if:
- SBP < 90 mmHg OR weak/rapid pulse, delayed capillary refill, cold extremities, reduced urine output.

Immediate steps:
1. Establish IV access (large-bore).  
2. Give isotonic crystalloid bolus (per protocol — monitor response).  
3. Monitor perfusion and level of consciousness.  
4. If persistent shock despite fluids → urgent referral and early vasopressor support if available.  
5. Document vital signs and time-stamp all interventions (essential for audit trails).  
(Reference: Shock recognition and initial management.)  


------------------------------------------------------------
SECTION 4 — MALARIA (EMERGENCY / SEVERE CASES)
------------------------------------------------------------
Suspect malaria in febrile patients from endemic areas or travel history.

If severe malaria suspected (danger signs: impaired consciousness, severe anemia, respiratory distress, inability to feed):
- Give parenteral artesunate when available (preferred). If artesunate not available, follow national guidance for alternative parenteral therapy (e.g., artemether or quinine where appropriate).  
- Continue parenteral therapy for at least 24 hours, then switch to oral when tolerated.  
- Supportive care (manage hypoglycaemia, severe anemia, seizures per protocol).  
- Urgent referral for higher-level care in severe presentations.

Quinine notes (when used): infuse slowly per dosing guidance; always check for hypoglycaemia and administer glucose if needed.  
(Reference: Emergency antimalarial guidance and parenteral therapy.)  


------------------------------------------------------------
SECTION 5 — SKIN LESIONS: SUSPICIOUS LESION / TRIAGE FOR BIOPSY
------------------------------------------------------------
Use the ABCDE rule for suspicious pigmented lesions:
- A: Asymmetry  
- B: Border irregularity  
- C: Color variation  
- D: Diameter > 6 mm  
- E: Evolving (change in size/shape/color)

Triage rule:
- If ≥ 2 ABCDE features OR repeated bleeding/ulceration → label "suspicious lesion" → urgent dermatology/biopsy referral.
- If referral unavailable: photograph lesion (standardized lighting, scale), advise urgent outpatient review, and arrange biopsy when trained personnel/equipment available (punch/shave/excision per local procedural guidance).
- If signs of local infection (pain, pus, spreading erythema, systemic fever) → manage as skin infection and escalate if severe.
(Reference: ABCDE + biopsy procedures.)  


------------------------------------------------------------
SECTION 6 — MENTAL-HEALTH TRIAGE (LOW-RESOURCE)
------------------------------------------------------------
Immediate red flag:
- Active suicidal ideation with intent/plan OR recent attempt → immediate safety intervention & urgent referral.

Priority screening:
- Low mood ≥ 2 weeks, marked anhedonia, or PHQ-9 ≥ 10 → prioritize mental-health follow-up; consider remote CBT / referral to available services.

Mild distress:
- Provide brief psychosocial support, safety-net advice, and arrange follow-up.

(Reference: Mental-health screening principles adapted for low-resource settings.)  


------------------------------------------------------------
SECTION 7 — SHORTAGE / TREATMENT FALLBACK GUIDANCE (DEMO-READY)
------------------------------------------------------------
- If first-line drug listed in local protocol is out_of_stock, suggest the designated fallback per local formulary, and flag to the clinician: "VERIFY local guidelines before prescribing."  
- Example: If amoxicillin unavailable → suggest amoxicillin-clavulanate or azithromycin where clinically appropriate; document stock event and chosen substitute.  
- For emergency drugs (IV artesunate, oxygen) with limited_stock → prioritize stabilization and urgent transfer.

(Use this section as the inventory cross-check logic for the demo.)  


------------------------------------------------------------
SECTION 8 — PROMPTING & INTEGRATION TIPS (for the hackathon)
------------------------------------------------------------
- Paste this file (or attach it) into the LLM system prompt as "Clinical_Guidelines.md". Then instruct the model: "Ground your triage decisions in Clinical_Guidelines.md and return JSON with keys: diagnosis, confidence, reasoning(3 bullets), observations, suggested_treatment (with stock_status), trial_eligibility, fhir_observation."  
- Prefer asking the model to cite which guideline line it used in each reasoning bullet (e.g., "Used Quick Check: SpO2 < 90% → urgent referral") for traceability.  
- Keep other knowledge (Merck/NICE) out of the immediate prompt unless you need additional nuance; paste targeted Merck snippets only when required.

------------------------------------------------------------
END
------------------------------------------------------------
Citations: Extracted from uploaded CLINISLOGIC.pdf (WHO IMAI District Clinician Manual).  
Verification file references in the upload:      