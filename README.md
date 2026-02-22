#  Prima-Care (MVP)

__"Bridging the Digital Divide in Global Health: High-Quality Clinical Triage, even Offline."__

The Equitable Triage & Trial Engine is a multimodal diagnostic web application designed to deliver high-quality clinical triage in low-resource settings. By leveraging decentralized Edge AI and Voice Biomarkers, the engine provides accessible care to the 37% of the global population currently offline, while creating a B2B matching gateway for pharmaceutical sponsors to recruit diverse, underrepresented populations for Decentralized Clinical Trials (DCTs).





# Core Features
## 📶 Offline-First Edge AI
- The diagnostic engine functions entirely without cloud connectivity. Using MedGemma 4B and Transformers.js, the app performs medical NLP and image classification directly on the user's smartphone.

- Local Image Classification: MedSigLIP vision encoder for instant analysis of skin lesions and retinal scans.   

- Data Sovereignty: Patient data never leaves the device during triage, ensuring absolute privacy.   

## 💊 Supply-Chain-Aware Recommendations
- Diagnostic reasoning is cross-referenced with real-time pharmaceutical inventory.

- Shortage Fallback: Automatically suggests the next-best, locally available therapeutic substitute if primary medications are out of stock.   

## 🔍 Explainable AI (XAI) Dashboard
- To build clinical trust, the AI is not a "black box."

- Reasoning Visualization: Implements SHAP and LIME to visually highlight the symptoms and biomarkers that led to the diagnosis.

## 🎙️ Multimodal Voice Biomarkers
- When internet is available, the engine utilizes Gemini 1.5 Pro to extract acoustic and linguistic biomarkers from patient speech.

- Respiratory & Mental Health: Analysis of jitter, shimmer, and HNR to screen for COPD, depression, and cognitive decline.   



# Technical Architecture
| **Layer** | **Technology** | **Function** |
| --- | --- | --- |
| Edge AI | MedGemma 4B / ONNX Runtime | Device-native medical reasoning |
| Cloud AI | Gemini 1.5 Pro (Vertex AI) | High-dimensional multimodal data fusion |
| Signal Processing | MedSigLIP Encoder | Zero-shot image interpretation |
| Interoperability | HL7 FHIR APIs | Standardized RWD and EHR integration |
| XAI Interface | SHAP / LIME | Additive feature attribution visualization |
| Backend | Python / FastAPI | Secure, role-based API management |
| Frontend | React / Tailwind CSS | Responsive, mobile-first patient interface |


# 🛠️ Getting Started
Prerequisites
Node.js (v18+)

Python 3.10+

Quantized MedGemma weights (Download via Hugging Face)


# Installation


 __1. Clone the Repository__


`git clone https://github.com/org/equitable-triage-engine.git
cd equitable-triage-engine`


 __2. Install Dependencies__


`npm install
pip install -r requirements.txt`

 __3. Local Deployment__

Backend: `uvicorn api.main:app --reload`

Frontend: `npm run dev`





# ⚖️ Regulatory Compliance
Designed for global medical integration, the engine supports:

FDA 21 CFR Part 11: Full audit trails and time-stamped electronic signatures.   

HIPAA & GDPR: Multi-pattern PHI masking and encrypted data-at-rest.   

HL7 FHIR R4: Seamless data exchange for decentralized clinical trials.   





# 🤝 B2B Value Proposition
For Sponsors/CROs: Access diverse, untapped patient populations.

Automated Matching: Pre-screen patients for active trials based on real-world diagnostic data.

Integrated eConsent: Seamlessly onboard participants for hybrid or virtual trials.   



# 📄 License
Distributed under the MIT License. See `LICENSE` for details.




# Conclusion: A Roadmap to Systemic Impact
The Equitable Triage & Trial Engine represents a fundamental shift toward an inclusive, localized medical future. By prioritizing the offline-first needs of underserved populations, the architecture ensures that the benefits of the AI revolution are not restricted by digital infrastructure. The integration of high-performance models like MedGemma 4B and Gemini 1.5 Pro allows for a level of diagnostic nuance previously impossible on mobile hardware.

Furthermore, by establishing a clear bridge to the pharmaceutical clinical trial market, the project creates a sustainable economic incentive for healthcare equity. As regulatory frameworks like the FDA’s diversity action plans become mandatory, tools like this engine will be the primary mechanism for ethical, efficient, and representative medical research. The technical rigor of its HL7 FHIR and Part 11 compliance transforms a hackathon prototype into a viable clinical assistant, ready to scale from rural villages to the legacy databases of global pharmaceutical leaders. The future of health is multimodal, decentralized, and above all, equitable.

