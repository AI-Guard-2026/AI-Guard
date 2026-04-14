# app/core/regulation.py
# EU AI Act Annex III — High Risk categories
# This is the legal source of truth for all classifications
# Updated to EU AI Act 2024/1689

REGULATION_VERSION = "EU AI Act 2024/1689"

# Annex III — Complete list of High Risk AI systems
# Each entry maps to exact article reference
ANNEX_III_CATEGORIES = {
    "biometric": {
        "article": "Annex III, Point 1",
        "description": "Biometric identification and categorisation of natural persons",
        "examples": [
            "real-time remote biometric identification",
            "post-remote biometric identification",
            "biometric categorisation",
            "emotion recognition systems",
        ],
        "keywords": [
            "facial recognition", "biometric", "fingerprint",
            "emotion detection", "voice recognition", "iris scan",
        ],
    },
    "critical_infrastructure": {
        "article": "Annex III, Point 2",
        "description": "AI in management and operation of critical infrastructure",
        "examples": [
            "AI managing electricity grids",
            "AI managing water supply systems",
            "AI managing gas networks",
            "AI managing digital infrastructure",
        ],
        "keywords": [
            "electricity grid", "water supply", "gas network",
            "critical infrastructure", "power grid", "utility management",
        ],
    },
    "education": {
        "article": "Annex III, Point 3",
        "description": "AI in education and vocational training",
        "examples": [
            "AI determining access to education",
            "AI grading exams",
            "AI assessing students",
            "AI detecting prohibited behaviour during tests",
        ],
        "keywords": [
            "student assessment", "exam grading", "education access",
            "university admission", "student evaluation", "learning assessment",
        ],
    },
    "employment": {
        "article": "Annex III, Point 4",
        "description": "AI in employment, worker management and access to self-employment",
        "examples": [
            "CV screening and ranking",
            "job application filtering",
            "promotion decisions",
            "task allocation to workers",
            "monitoring worker performance",
            "termination decisions",
        ],
        "keywords": [
            "cv screening", "recruitment", "hiring", "job application",
            "worker monitoring", "performance evaluation", "promotion",
            "termination", "workforce management", "employee assessment",
        ],
    },
    "essential_services": {
        "article": "Annex III, Point 5",
        "description": "AI in access to essential private and public services",
        "examples": [
            "credit scoring for loans",
            "insurance risk assessment",
            "health and life insurance pricing",
            "social benefits eligibility",
            "emergency services routing",
        ],
        "keywords": [
            "credit scoring", "credit decision", "loan approval",
            "insurance risk", "insurance pricing", "social benefits",
            "creditworthiness", "financial assessment", "benefit eligibility",
        ],
    },
    "law_enforcement": {
        "article": "Annex III, Point 6",
        "description": "AI used by law enforcement authorities",
        "examples": [
            "individual risk assessment for crime",
            "polygraph systems",
            "crime analytics",
            "profiling during criminal investigations",
        ],
        "keywords": [
            "law enforcement", "crime prediction", "police", "criminal",
            "investigation", "profiling", "risk assessment crime",
        ],
    },
    "migration": {
        "article": "Annex III, Point 7",
        "description": "AI in migration, asylum and border control management",
        "examples": [
            "visa application assessment",
            "asylum claim evaluation",
            "border control risk assessment",
            "document authenticity verification",
        ],
        "keywords": [
            "visa", "asylum", "border control", "migration",
            "immigration", "refugee", "travel document",
        ],
    },
    "justice": {
        "article": "Annex III, Point 8",
        "description": "AI in administration of justice and democratic processes",
        "examples": [
            "AI assisting courts in researching facts",
            "AI applying law to facts",
            "AI influencing elections",
        ],
        "keywords": [
            "court", "judicial", "justice", "legal decision",
            "election", "democratic", "law application",
        ],
    },
}

# Systems that are completely BANNED under Article 5
PROHIBITED_SYSTEMS = [
    "social scoring by governments",
    "real-time biometric surveillance in public spaces",
    "subliminal manipulation",
    "exploitation of vulnerabilities",
    "untargeted scraping for facial recognition databases",
    "emotion recognition in workplace or education",
    "predictive policing based solely on profiling",
]

# Keywords that suggest MINIMAL risk — no obligations
MINIMAL_RISK_KEYWORDS = [
    "spam filter", "recommendation engine", "content moderation",
    "inventory management", "price optimisation", "weather forecasting",
    "translation", "image classification", "search ranking",
    "fraud detection pattern", "predictive maintenance",
    "customer segmentation marketing",
]

# Keywords that suggest LIMITED risk — transparency only
LIMITED_RISK_KEYWORDS = [
    "chatbot", "virtual assistant", "deepfake", "ai generated content",
    "synthetic media", "conversational ai",
]