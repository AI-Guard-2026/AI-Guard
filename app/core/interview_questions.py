# app/core/interview_questions.py
# Structured interview questions for Annex IV document generation
# Questions are grouped by Annex IV section
# Sector-specific questions added based on AI system type

from typing import Optional

GENERAL_QUESTIONS = {
    "section_1_general": {
        "title": "General Description",
        "questions": [
            {
                "id": "q1_intended_purpose",
                "question": "What is the specific intended purpose of this AI system?",
                "help": "Describe exactly what decisions or outputs the system produces",
                "required": True,
            },
            {
                "id": "q2_intended_users",
                "question": "Who are the intended deployers and users of this system?",
                "help": "e.g. loan officers, HR managers, medical staff",
                "required": True,
            },
            {
                "id": "q3_affected_persons",
                "question": "Who are the persons affected by the outputs of this system?",
                "help": "e.g. loan applicants, job candidates, patients",
                "required": True,
            },
            {
                "id": "q4_geographic_scope",
                "question": "In which EU member states is this system deployed?",
                "help": "List all countries where the system is actively used",
                "required": True,
            },
            {
                "id": "q5_version",
                "question": "What is the current version of the system?",
                "required": False,
            },
        ],
    },
    "section_2_architecture": {
        "title": "System Architecture and Components",
        "questions": [
            {
                "id": "q6_system_type",
                "question": "What type of AI/ML approach does this system use?",
                "help": "e.g. neural network, decision tree, large language model, rule-based",
                "required": True,
            },
            {
                "id": "q7_hardware",
                "question": "What hardware infrastructure does this system run on?",
                "help": "e.g. cloud-based AWS, on-premise servers, edge devices",
                "required": True,
            },
            {
                "id": "q8_third_party",
                "question": "Does the system use any third-party AI components or APIs?",
                "help": "e.g. OpenAI GPT, Google Cloud AI, AWS Bedrock",
                "required": False,
            },
            {
                "id": "q9_integration",
                "question": "What other systems does this AI system integrate with?",
                "help": "e.g. CRM, ERP, databases, external APIs",
                "required": False,
            },
        ],
    },
    "section_3_data": {
        "title": "Training Data and Data Governance",
        "questions": [
            {
                "id": "q10_training_data",
                "question": "What data was used to train this system?",
                "help": "Describe the datasets, their source, and time period covered",
                "required": True,
            },
            {
                "id": "q11_data_volume",
                "question": "What is the approximate size of the training dataset?",
                "help": "e.g. 500,000 records, 2 years of historical data",
                "required": False,
            },
            {
                "id": "q12_bias_testing",
                "question": "What bias testing was performed on the training data?",
                "help": "e.g. demographic parity testing, disparate impact analysis",
                "required": True,
            },
            {
                "id": "q13_data_quality",
                "question": "How is data quality and completeness ensured?",
                "help": "Describe validation processes, data cleaning steps",
                "required": True,
            },
            {
                "id": "q14_personal_data",
                "question": "Does the system process personal data? If yes, what categories?",
                "help": "e.g. financial data, biometric data, health data",
                "required": True,
            },
        ],
    },
    "section_4_performance": {
        "title": "Performance and Accuracy",
        "questions": [
            {
                "id": "q15_accuracy",
                "question": "What is the measured accuracy or performance metric of this system?",
                "help": "e.g. 94% accuracy, AUC score of 0.87, F1 score of 0.91",
                "required": True,
            },
            {
                "id": "q16_testing",
                "question": "How was the system tested before deployment?",
                "help": "Describe test datasets, validation methodology, A/B testing",
                "required": True,
            },
            {
                "id": "q17_known_limitations",
                "question": "What are the known limitations or failure modes of this system?",
                "help": "Be specific — what inputs cause incorrect outputs",
                "required": True,
            },
            {
                "id": "q18_performance_monitoring",
                "question": "How is system performance monitored after deployment?",
                "help": "e.g. monthly accuracy checks, automated drift detection",
                "required": True,
            },
        ],
    },
    "section_5_human_oversight": {
        "title": "Human Oversight Mechanisms",
        "questions": [
            {
                "id": "q19_human_review",
                "question": "How can humans review and override the system's outputs?",
                "help": "Describe the override process step by step",
                "required": True,
            },
            {
                "id": "q20_override_authority",
                "question": "Who has authority to override the system's decisions?",
                "help": "e.g. senior loan officer, compliance manager",
                "required": True,
            },
            {
                "id": "q21_stop_mechanism",
                "question": "How can the system be stopped or suspended immediately?",
                "help": "Describe the kill switch or suspension process",
                "required": True,
            },
            {
                "id": "q22_user_training",
                "question": "What training do users receive before operating this system?",
                "help": "Describe training programme, duration, certification",
                "required": True,
            },
        ],
    },
    "section_6_changes": {
        "title": "Logging and Change Management",
        "questions": [
            {
                "id": "q23_logging",
                "question": "What events and outputs does the system automatically log?",
                "help": "e.g. all decisions, inputs used, confidence scores, timestamps",
                "required": True,
            },
            {
                "id": "q24_log_retention",
                "question": "How long are logs retained and where are they stored?",
                "help": "EU AI Act requires logs kept for minimum 6 months for some systems",
                "required": True,
            },
            {
                "id": "q25_change_process",
                "question": "What process is followed when the system is updated or retrained?",
                "help": "Describe validation, testing, approval steps before any update",
                "required": True,
            },
        ],
    },
}

# Additional questions for specific sectors
SECTOR_QUESTIONS = {
    "fintech": [
        {
            "id": "sq_fintech_1",
            "question": "What regulatory framework governs this AI system in financial services?",
            "help": "e.g. CRD VI, PSD3, EBA guidelines on internal governance",
            "required": True,
        },
        {
            "id": "sq_fintech_2",
            "question": "How are adverse decisions communicated to affected customers?",
            "help": "e.g. automated letter, human follow-up call, appeal process",
            "required": True,
        },
        {
            "id": "sq_fintech_3",
            "question": "What is the appeals process for customers who dispute the system's decision?",
            "required": True,
        },
    ],
    "hr": [
        {
            "id": "sq_hr_1",
            "question": "How are candidates informed that an AI system is used in their assessment?",
            "required": True,
        },
        {
            "id": "sq_hr_2",
            "question": "What protected characteristics were tested for bias in this system?",
            "help": "e.g. gender, ethnicity, age, disability",
            "required": True,
        },
        {
            "id": "sq_hr_3",
            "question": "Can candidates request human review of the AI's assessment?",
            "required": True,
        },
    ],
    "healthcare": [
        {
            "id": "sq_health_1",
            "question": "Is this system classified as a medical device under EU MDR 2017/745?",
            "required": True,
        },
        {
            "id": "sq_health_2",
            "question": "What clinical validation studies were conducted for this system?",
            "required": True,
        },
        {
            "id": "sq_health_3",
            "question": "How are clinicians trained to interpret and verify the system's outputs?",
            "required": True,
        },
    ],
}


# app/core/interview_questions.py
# Structured interview questions for Annex IV document generation
# Questions are grouped by Annex IV section
# Sector-specific questions added based on AI system type

GENERAL_QUESTIONS = {
    "section_1_general": {
        "title": "General Description",
        "questions": [
            {
                "id": "q1_intended_purpose",
                "question": "What is the specific intended purpose of this AI system?",
                "help": "Describe exactly what decisions or outputs the system produces",
                "required": True,
            },
            {
                "id": "q2_intended_users",
                "question": "Who are the intended deployers and users of this system?",
                "help": "e.g. loan officers, HR managers, medical staff",
                "required": True,
            },
            {
                "id": "q3_affected_persons",
                "question": "Who are the persons affected by the outputs of this system?",
                "help": "e.g. loan applicants, job candidates, patients",
                "required": True,
            },
            {
                "id": "q4_geographic_scope",
                "question": "In which EU member states is this system deployed?",
                "help": "List all countries where the system is actively used",
                "required": True,
            },
            {
                "id": "q5_version",
                "question": "What is the current version of the system?",
                "required": False,
            },
        ],
    },
    "section_2_architecture": {
        "title": "System Architecture and Components",
        "questions": [
            {
                "id": "q6_system_type",
                "question": "What type of AI/ML approach does this system use?",
                "help": "e.g. neural network, decision tree, large language model, rule-based",
                "required": True,
            },
            {
                "id": "q7_hardware",
                "question": "What hardware infrastructure does this system run on?",
                "help": "e.g. cloud-based AWS, on-premise servers, edge devices",
                "required": True,
            },
            {
                "id": "q8_third_party",
                "question": "Does the system use any third-party AI components or APIs?",
                "help": "e.g. OpenAI GPT, Google Cloud AI, AWS Bedrock",
                "required": False,
            },
            {
                "id": "q9_integration",
                "question": "What other systems does this AI system integrate with?",
                "help": "e.g. CRM, ERP, databases, external APIs",
                "required": False,
            },
        ],
    },
    "section_3_data": {
        "title": "Training Data and Data Governance",
        "questions": [
            {
                "id": "q10_training_data",
                "question": "What data was used to train this system?",
                "help": "Describe the datasets, their source, and time period covered",
                "required": True,
            },
            {
                "id": "q11_data_volume",
                "question": "What is the approximate size of the training dataset?",
                "help": "e.g. 500,000 records, 2 years of historical data",
                "required": False,
            },
            {
                "id": "q12_bias_testing",
                "question": "What bias testing was performed on the training data?",
                "help": "e.g. demographic parity testing, disparate impact analysis",
                "required": True,
            },
            {
                "id": "q13_data_quality",
                "question": "How is data quality and completeness ensured?",
                "help": "Describe validation processes, data cleaning steps",
                "required": True,
            },
            {
                "id": "q14_personal_data",
                "question": "Does the system process personal data? If yes, what categories?",
                "help": "e.g. financial data, biometric data, health data",
                "required": True,
            },
        ],
    },
    "section_4_performance": {
        "title": "Performance and Accuracy",
        "questions": [
            {
                "id": "q15_accuracy",
                "question": "What is the measured accuracy or performance metric of this system?",
                "help": "e.g. 94% accuracy, AUC score of 0.87, F1 score of 0.91",
                "required": True,
            },
            {
                "id": "q16_testing",
                "question": "How was the system tested before deployment?",
                "help": "Describe test datasets, validation methodology, A/B testing",
                "required": True,
            },
            {
                "id": "q17_known_limitations",
                "question": "What are the known limitations or failure modes of this system?",
                "help": "Be specific — what inputs cause incorrect outputs",
                "required": True,
            },
            {
                "id": "q18_performance_monitoring",
                "question": "How is system performance monitored after deployment?",
                "help": "e.g. monthly accuracy checks, automated drift detection",
                "required": True,
            },
        ],
    },
    "section_5_human_oversight": {
        "title": "Human Oversight Mechanisms",
        "questions": [
            {
                "id": "q19_human_review",
                "question": "How can humans review and override the system's outputs?",
                "help": "Describe the override process step by step",
                "required": True,
            },
            {
                "id": "q20_override_authority",
                "question": "Who has authority to override the system's decisions?",
                "help": "e.g. senior loan officer, compliance manager",
                "required": True,
            },
            {
                "id": "q21_stop_mechanism",
                "question": "How can the system be stopped or suspended immediately?",
                "help": "Describe the kill switch or suspension process",
                "required": True,
            },
            {
                "id": "q22_user_training",
                "question": "What training do users receive before operating this system?",
                "help": "Describe training programme, duration, certification",
                "required": True,
            },
        ],
    },
    "section_6_changes": {
        "title": "Logging and Change Management",
        "questions": [
            {
                "id": "q23_logging",
                "question": "What events and outputs does the system automatically log?",
                "help": "e.g. all decisions, inputs used, confidence scores, timestamps",
                "required": True,
            },
            {
                "id": "q24_log_retention",
                "question": "How long are logs retained and where are they stored?",
                "help": "EU AI Act requires logs kept for minimum 6 months for some systems",
                "required": True,
            },
            {
                "id": "q25_change_process",
                "question": "What process is followed when the system is updated or retrained?",
                "help": "Describe validation, testing, approval steps before any update",
                "required": True,
            },
        ],
    },
}

# Additional questions for specific sectors
SECTOR_QUESTIONS = {
    "fintech": [
        {
            "id": "sq_fintech_1",
            "question": "What regulatory framework governs this AI system in financial services?",
            "help": "e.g. CRD VI, PSD3, EBA guidelines on internal governance",
            "required": True,
        },
        {
            "id": "sq_fintech_2",
            "question": "How are adverse decisions communicated to affected customers?",
            "help": "e.g. automated letter, human follow-up call, appeal process",
            "required": True,
        },
        {
            "id": "sq_fintech_3",
            "question": "What is the appeals process for customers who dispute the system's decision?",
            "required": True,
        },
    ],
    "hr": [
        {
            "id": "sq_hr_1",
            "question": "How are candidates informed that an AI system is used in their assessment?",
            "required": True,
        },
        {
            "id": "sq_hr_2",
            "question": "What protected characteristics were tested for bias in this system?",
            "help": "e.g. gender, ethnicity, age, disability",
            "required": True,
        },
        {
            "id": "sq_hr_3",
            "question": "Can candidates request human review of the AI's assessment?",
            "required": True,
        },
    ],
    "healthcare": [
        {
            "id": "sq_health_1",
            "question": "Is this system classified as a medical device under EU MDR 2017/745?",
            "required": True,
        },
        {
            "id": "sq_health_2",
            "question": "What clinical validation studies were conducted for this system?",
            "required": True,
        },
        {
            "id": "sq_health_3",
            "question": "How are clinicians trained to interpret and verify the system's outputs?",
            "required": True,
        },
    ],
}

def get_questions_for_system(sector: Optional[str] = None) -> dict:
    """
    Get the full question set for a given sector.
    Always includes general questions.
    Adds sector-specific questions if sector matches.
    """
    questions = dict(GENERAL_QUESTIONS)

    if sector and sector.lower() in SECTOR_QUESTIONS:
        questions["section_7_sector_specific"] = {
            "title": f"Sector-Specific Requirements ({sector.title()})",
            "questions": SECTOR_QUESTIONS[sector.lower()],
        }

    return questions