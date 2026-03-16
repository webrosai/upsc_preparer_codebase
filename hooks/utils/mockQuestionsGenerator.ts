// Mock Questions Generator for UPSC Test Builder
// Used as fallback when webhook doesn't return valid data

interface MockQuestion {
  question_id: string
  serial_no: number
  source: "pyq" | "mock"
  year?: number
  question_text: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  metadata: {
    subject: string
    theme: string
    sub_theme?: string
    difficulty: string
  }
  correct_answer: string
  explanation: string
}

const questionBank: Record<string, MockQuestion[]> = {
  "Ancient History": [
    {
      question_id: "AH001",
      serial_no: 1,
      source: "pyq",
      year: 2023,
      question_text: "Which of the following Harappan sites is NOT located in India?",
      options: {
        A: "Lothal",
        B: "Kalibangan",
        C: "Mohenjo-daro",
        D: "Dholavira"
      },
      metadata: { subject: "Ancient History", theme: "Indus Valley Civilization", difficulty: "Easy" },
      correct_answer: "C",
      explanation: "Mohenjo-daro is located in Sindh, Pakistan, while Lothal (Gujarat), Kalibangan (Rajasthan), and Dholavira (Gujarat) are in India."
    },
    {
      question_id: "AH002",
      serial_no: 2,
      source: "mock",
      question_text: "The term 'Aryan' in the ancient Indian context refers to:",
      options: {
        A: "A racial group",
        B: "A linguistic group",
        C: "A religious group",
        D: "A political organization"
      },
      metadata: { subject: "Ancient History", theme: "Vedic Period", difficulty: "Medium" },
      correct_answer: "B",
      explanation: "In the ancient Indian context, 'Aryan' primarily refers to a linguistic group speaking Indo-European languages, not a racial category."
    }
  ],
  "Polity & Governance": [
    {
      question_id: "PG001",
      serial_no: 1,
      source: "pyq",
      year: 2024,
      question_text: "Which Article of the Indian Constitution deals with the Right to Constitutional Remedies?",
      options: {
        A: "Article 19",
        B: "Article 21",
        C: "Article 32",
        D: "Article 44"
      },
      metadata: { subject: "Polity & Governance", theme: "Fundamental Rights", difficulty: "Easy" },
      correct_answer: "C",
      explanation: "Article 32 guarantees the Right to Constitutional Remedies, which Dr. B.R. Ambedkar called the 'heart and soul' of the Constitution."
    },
    {
      question_id: "PG002",
      serial_no: 2,
      source: "mock",
      question_text: "The 73rd Constitutional Amendment Act is related to:",
      options: {
        A: "Fundamental Duties",
        B: "Panchayati Raj",
        C: "Anti-Defection Law",
        D: "Cooperative Societies"
      },
      metadata: { subject: "Polity & Governance", theme: "Local Government", difficulty: "Medium" },
      correct_answer: "B",
      explanation: "The 73rd Amendment Act, 1992 gave constitutional status to Panchayati Raj institutions and added Part IX to the Constitution."
    }
  ],
  "Geography": [
    {
      question_id: "GE001",
      serial_no: 1,
      source: "pyq",
      year: 2023,
      question_text: "The Western Ghats are younger than the Eastern Ghats. This statement is:",
      options: {
        A: "True",
        B: "False",
        C: "Partially true",
        D: "Cannot be determined"
      },
      metadata: { subject: "Geography", theme: "Physical Geography", difficulty: "Medium" },
      correct_answer: "B",
      explanation: "The Eastern Ghats are younger than the Western Ghats. Western Ghats were formed during the Mesozoic Era while Eastern Ghats are relatively recent."
    },
    {
      question_id: "GE002",
      serial_no: 2,
      source: "mock",
      question_text: "Which of the following rivers does NOT originate in India?",
      options: {
        A: "Brahmaputra",
        B: "Ganga",
        C: "Godavari",
        D: "Krishna"
      },
      metadata: { subject: "Geography", theme: "Rivers", difficulty: "Easy" },
      correct_answer: "A",
      explanation: "Brahmaputra originates in Tibet near Mount Kailash as Tsangpo. It enters India in Arunachal Pradesh."
    }
  ],
  "Economy": [
    {
      question_id: "EC001",
      serial_no: 1,
      source: "pyq",
      year: 2024,
      question_text: "Which of the following is NOT a function of the Reserve Bank of India?",
      options: {
        A: "Monetary Policy formulation",
        B: "Currency issuance",
        C: "Direct tax collection",
        D: "Banker to the Government"
      },
      metadata: { subject: "Economy", theme: "Banking", difficulty: "Easy" },
      correct_answer: "C",
      explanation: "Direct tax collection is handled by the Income Tax Department under the Ministry of Finance, not by RBI."
    },
    {
      question_id: "EC002",
      serial_no: 2,
      source: "mock",
      question_text: "The term 'Twin Balance Sheet Problem' in Indian economy refers to:",
      options: {
        A: "Fiscal deficit and current account deficit",
        B: "Stressed assets of banks and over-leveraged corporates",
        C: "Trade deficit and budget deficit",
        D: "Revenue deficit and primary deficit"
      },
      metadata: { subject: "Economy", theme: "Economic Issues", difficulty: "Hard" },
      correct_answer: "B",
      explanation: "Twin Balance Sheet Problem refers to the simultaneous problem of stressed assets in banks (NPAs) and highly leveraged corporate balance sheets."
    }
  ],
  "Environment": [
    {
      question_id: "EN001",
      serial_no: 1,
      source: "pyq",
      year: 2023,
      question_text: "Which of the following is the correct sequence of ecological succession in a pond?",
      options: {
        A: "Phytoplankton → Submerged plants → Floating plants → Reed swamp → Woodland",
        B: "Submerged plants → Phytoplankton → Floating plants → Woodland → Reed swamp",
        C: "Floating plants → Phytoplankton → Submerged plants → Reed swamp → Woodland",
        D: "Reed swamp → Submerged plants → Floating plants → Phytoplankton → Woodland"
      },
      metadata: { subject: "Environment", theme: "Ecology", difficulty: "Hard" },
      correct_answer: "A",
      explanation: "Hydrarch succession in a pond follows the sequence: Phytoplankton → Submerged plants → Floating plants → Reed swamp → Woodland."
    }
  ],
  "Science & Technology": [
    {
      question_id: "ST001",
      serial_no: 1,
      source: "mock",
      question_text: "CRISPR-Cas9 technology is primarily used for:",
      options: {
        A: "Artificial Intelligence",
        B: "Gene Editing",
        C: "Quantum Computing",
        D: "Blockchain"
      },
      metadata: { subject: "Science & Technology", theme: "Biotechnology", difficulty: "Medium" },
      correct_answer: "B",
      explanation: "CRISPR-Cas9 is a revolutionary gene-editing technology that allows precise modification of DNA sequences in living organisms."
    }
  ],
  "Current Affairs": [
    {
      question_id: "CA001",
      serial_no: 1,
      source: "mock",
      question_text: "Which organization releases the World Happiness Report?",
      options: {
        A: "World Bank",
        B: "United Nations",
        C: "IMF",
        D: "WTO"
      },
      metadata: { subject: "Current Affairs", theme: "International Reports", difficulty: "Easy" },
      correct_answer: "B",
      explanation: "The World Happiness Report is published by the UN Sustainable Development Solutions Network."
    }
  ],
  "International Relations": [
    {
      question_id: "IR001",
      serial_no: 1,
      source: "pyq",
      year: 2024,
      question_text: "QUAD is a strategic dialogue between which countries?",
      options: {
        A: "India, USA, UK, Australia",
        B: "India, USA, Japan, Australia",
        C: "India, France, Japan, Australia",
        D: "India, USA, Japan, South Korea"
      },
      metadata: { subject: "International Relations", theme: "Strategic Groups", difficulty: "Easy" },
      correct_answer: "B",
      explanation: "QUAD (Quadrilateral Security Dialogue) comprises India, USA, Japan, and Australia, focused on Indo-Pacific security."
    }
  ]
}

// Default questions for subjects without specific questions
const defaultQuestions: MockQuestion[] = [
  {
    question_id: "DEF001",
    serial_no: 1,
    source: "mock",
    question_text: "The Preamble to the Indian Constitution was amended by which Constitutional Amendment?",
    options: {
      A: "42nd Amendment",
      B: "44th Amendment",
      C: "52nd Amendment",
      D: "73rd Amendment"
    },
    metadata: { subject: "Polity & Governance", theme: "Constitutional Framework", difficulty: "Easy" },
    correct_answer: "A",
    explanation: "The 42nd Amendment (1976) added the words 'Socialist', 'Secular', and 'Integrity' to the Preamble."
  },
  {
    question_id: "DEF002",
    serial_no: 2,
    source: "mock",
    question_text: "Which Five Year Plan was terminated one year before its scheduled completion?",
    options: {
      A: "Third Five Year Plan",
      B: "Fourth Five Year Plan",
      C: "Fifth Five Year Plan",
      D: "Sixth Five Year Plan"
    },
    metadata: { subject: "Economy", theme: "Planning", difficulty: "Medium" },
    correct_answer: "C",
    explanation: "The Fifth Five Year Plan (1974-79) was terminated in 1978, one year ahead of schedule, by the Janata Government."
  },
  {
    question_id: "DEF003",
    serial_no: 3,
    source: "pyq",
    year: 2022,
    question_text: "The concept of 'Judicial Review' in India has been borrowed from:",
    options: {
      A: "UK",
      B: "USA",
      C: "France",
      D: "Germany"
    },
    metadata: { subject: "Polity & Governance", theme: "Judiciary", difficulty: "Easy" },
    correct_answer: "B",
    explanation: "Judicial Review, the power of courts to examine the constitutionality of laws, was borrowed from the USA."
  }
]

export function generateMockQuestions(
  count: number,
  subjects: string[],
  difficulties: string[]
): MockQuestion[] {
  const questions: MockQuestion[] = []
  let serialNo = 1

  // Get questions from selected subjects
  const subjectsToUse = subjects.length > 0 ? subjects : Object.keys(questionBank)
  
  for (const subject of subjectsToUse) {
    const subjectQuestions = questionBank[subject] || []
    for (const q of subjectQuestions) {
      if (difficulties.length === 0 || difficulties.includes(q.metadata.difficulty)) {
        questions.push({
          ...q,
          question_id: `Q_${Date.now()}_${serialNo}`,
          serial_no: serialNo++
        })
      }
      if (questions.length >= count) break
    }
    if (questions.length >= count) break
  }

  // If we still need more questions, add from defaults
  while (questions.length < count) {
    const defaultQ = defaultQuestions[questions.length % defaultQuestions.length]
    questions.push({
      ...defaultQ,
      question_id: `Q_${Date.now()}_${serialNo}`,
      serial_no: serialNo++
    })
  }

  return questions.slice(0, count)
}
