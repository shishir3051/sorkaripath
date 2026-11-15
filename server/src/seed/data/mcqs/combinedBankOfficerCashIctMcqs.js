export const combinedBankOfficerCashIctMcqs = [
  // ================= Combined Bank Officer & Cash (2018-2024) Archive =================
  {
    question:
      "Two successive discounts of 20% and 10% on a product are equivalent to what single percentage discount?",
    options: ["25%", "28%", "30%", "32%"],
    correctIndex: 1,
    explanation:
      "Effective discount formula: a + b − (ab/100) = 20 + 10 − (20 × 10)/100 = 30 − 2 = 28%. (Verify on 100: 100 → 80 → 72, net drop 28%).",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer (Cash) Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["discount", "percentage", "bank-cash"],
  },
  {
    question:
      "If 12 bank tellers can process a batch of audited vouchers in 16 days, how many tellers are required to finish the same batch in 8 days?",
    options: ["18", "20", "24", "30"],
    correctIndex: 2,
    explanation:
      "Inverse proportion (M₁ × D₁ = M₂ × D₂): 12 × 16 = M₂ × 8 ⇒ M₂ = (12 × 16) / 8 = 24 tellers.",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["ratio", "work-days", "bank-officer"],
  },
  {
    question:
      "What is the least whole number that must be subtracted from 1,360 so that the remainder is exactly divisible by 87?",
    options: ["45", "55", "65", "32"],
    correctIndex: 1,
    explanation:
      "Divide 1,360 by 87: 87 × 15 = 1,305. Remainder = 1,360 − 1,305 = 55. Subtracting 55 leaves 1,305 which is evenly divisible by 87.",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer (Cash) Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["number-system", "divisibility", "bank-cash"],
  },
  {
    question:
      "A student gets 30% marks in a screening exam and fails by 15 marks. Another student gets 40% marks and scores 35 marks above the pass mark. What are the total maximum marks of the exam?",
    options: ["300", "400", "500", "600"],
    correctIndex: 2,
    explanation:
      "Difference in percentage = 40% − 30% = 10%. Difference in marks = 35 − (−15) = 50 marks. So 10% = 50 ⇒ 100% = 500 total marks (pass mark = 165).",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["percentage", "equation", "bank-officer"],
  },
  {
    question:
      "What is the decimal value of the binary number (101101)₂?",
    options: ["39", "43", "45", "53"],
    correctIndex: 2,
    explanation:
      "(101101)₂ = 1×2⁵ + 0×2⁴ + 1×2³ + 1×2² + 0×2¹ + 1×2⁰ = 32 + 0 + 8 + 4 + 0 + 1 = 45.",
    subject: "General Science & ICT",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank IT/Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["binary", "number-conversion", "ict", "bank-officer"],
  },
  {
    question:
      "In database management systems, what does 'ACID' stand for in ensuring reliable banking transaction processing?",
    options: [
      "Atomicity, Consistency, Isolation, Durability",
      "Access, Control, Integrity, Delivery",
      "Authentication, Cryptography, Identity, Data",
      "Array, Column, Index, Database",
    ],
    correctIndex: 0,
    explanation:
      "Core banking databases enforce ACID properties—Atomicity (all-or-nothing), Consistency (valid state), Isolation (concurrent safety), and Durability (permanent commit even on crash).",
    subject: "General Science & ICT",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["acid", "dbms", "banking-ict"],
  },
  {
    question:
      "How many bits compose an IPv6 address compared to a standard IPv4 address?",
    options: [
      "IPv6 uses 128 bits while IPv4 uses 32 bits",
      "IPv6 uses 64 bits while IPv4 uses 16 bits",
      "IPv6 uses 256 bits while IPv4 uses 64 bits",
      "Both IPv4 and IPv6 use 48 bits like a MAC address",
    ],
    correctIndex: 0,
    explanation:
      "IPv4 uses 32 bits (4 octets, ~4.3 billion addresses), whereas IPv6 uses 128 bits written in 8 hexadecimal groups; a hardware MAC address uses 48 bits.",
    subject: "General Science & ICT",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer ICT",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["ipv6", "ipv4", "networking", "bank-officer"],
  },
  {
    question:
      "In cloud computing services used by fintech and banks, what do 'IaaS, PaaS, and SaaS' stand for respectively?",
    options: [
      "Infrastructure as a Service, Platform as a Service, Software as a Service",
      "Internet, Program, and Security as a Service",
      "Information, Payment, and System as a Service",
      "Integration, Analytics, and Storage as a Service",
    ],
    correctIndex: 0,
    explanation:
      "Cloud service layers: IaaS (virtual servers/networks like EC2), PaaS (runtime/deployment platforms), and SaaS (ready end-user web software like Gmail or Microsoft 365).",
    subject: "General Science & ICT",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank ICT Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["cloud-computing", "ict", "bank-officer"],
  },
  {
    question:
      "Which logic gate outputs HIGH (1) ONLY when ALL of its inputs are HIGH (1), and which gate is known as a 'Universal Gate'?",
    options: [
      "AND gate outputs 1 only when all inputs are 1; NAND and NOR are Universal Gates",
      "OR gate outputs 1 only when all inputs are 1; XOR is Universal",
      "NOT gate; AND and OR are Universal",
      "XOR gate; XNOR is Universal",
    ],
    correctIndex: 0,
    explanation:
      "AND gate implements multiplication (A·B = 1 iff A=1 and B=1). NAND and NOR are Universal Gates because every basic gate (AND, OR, NOT) can be constructed using solely NANDs or solely NORs.",
    subject: "General Science & ICT",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer ICT",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["logic-gates", "digital-logic", "ict"],
  },
  {
    question:
      "In MS Excel (heavily tested in Bank Officer & Practical exams), which function looks up a value in the leftmost column of a table and returns a value in the same row from a specified column?",
    options: ["VLOOKUP", "SUMIF", "CONCAT", "COUNTBLANK"],
    correctIndex: 0,
    explanation:
      "VLOOKUP (Vertical Lookup) searches vertically down the first column of a range; HLOOKUP searches horizontally; XLOOKUP is the modern successor.",
    subject: "General Science & ICT",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer Practical/MCQ",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["excel", "vlookup", "ict"],
  },
  {
    question:
      "Select the correct appropriate preposition: 'Every scheduled bank must comply ___ the prudential regulations of Bangladesh Bank.'",
    options: ["to", "with", "for", "at"],
    correctIndex: 1,
    explanation:
      "Usage rule: 'comply WITH' a rule/order/regulation, whereas 'abide BY' and 'conform TO' share the same sense with different prepositions.",
    subject: "English",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer (Cash) Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["preposition", "bank-cash"],
  },
  {
    question:
      "Choose the correct meaning of the phrase 'A white elephant':",
    options: [
      "An extremely rare albino animal prized by zoos",
      "A very costly possession or project whose maintenance expense outweighs its usefulness",
      "An unexpected windfall bonus",
      "A loyal business partner",
    ],
    correctIndex: 1,
    explanation:
      "'White elephant' refers to an expensive asset or grand project that is burdensome to maintain and produces little practical return (বৃহৎ কিন্তু ব্যয়বহুল ও অলাভজনক সম্পদ).",
    subject: "English",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["idiom", "english", "bank-officer"],
  },
  {
    question:
      "Fill in the blank with right preposition: 'No one is immune ___ accountability when auditing public funds.'",
    options: ["to / from", "at", "with", "on"],
    correctIndex: 0,
    explanation:
      "'Immune' correctly takes 'to' (biological/figurative resistance, e.g., immune to criticism/disease) or 'from' (exempt from obligation/prosecution, e.g., immune from prosecution).",
    subject: "English",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["preposition", "bank-officer"],
  },
  {
    question:
      "Identify the correctly spelt word from Combined Bank Cash/Officer screening papers:",
    options: ["Reconciliation", "Reconsiliation", "Reconcilation", "Recconciliation"],
    correctIndex: 0,
    explanation:
      "Correct spelling: R-e-c-o-n-c-i-l-i-a-t-i-o-n ('Bank Reconciliation Statement' is also a foundational accounting topic!).",
    subject: "English",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer (Cash) Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["spelling", "english", "bank-cash"],
  },
  {
    question:
      "In international trade financing, what does 'FOB' stand for in export-import pricing terms (Incoterms)?",
    options: [
      "Free On Board (seller bears cost until goods are loaded onto the vessel)",
      "Freight Only Balance",
      "Foreign Official Bill",
      "Final Order Booking",
    ],
    correctIndex: 0,
    explanation:
      "Under Incoterms, FOB (Free On Board) means the seller delivers goods onto the buyer's nominated ship at the port of shipment; CIF (Cost, Insurance, and Freight) includes sea freight and marine insurance to destination.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["incoterms", "fob", "trade-finance", "bank-officer"],
  },
  {
    question:
      "Which statute primarily governs the licensing, governance, capital, and supervision of commercial banks operating in Bangladesh?",
    options: [
      "The Bank Company Act, 1991 (ব্যাংক কোম্পানি আইন, ১৯৯১)",
      "The Companies Act, 1994 only",
      "The Cooperative Societies Act, 2001",
      "The Trust Act, 1882",
    ],
    correctIndex: 0,
    explanation:
      "While Bangladesh Bank itself is constituted under the Bangladesh Bank Order, 1972, commercial banks are regulated primarily under the Bank Company Act, 1991 (as amended in 2013, 2018, and 2023).",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["bank-company-act", "banking-law", "bank-officer"],
  },
  {
    question:
      "What is a 'Nostro Account' in international correspondent banking?",
    options: [
      "Our bank's foreign currency account held with a foreign correspondent bank abroad ('Our money with you')",
      "A local rural savings account in Taka",
      "A blocked dormant locker account",
      "A student education loan ledger",
    ],
    correctIndex: 0,
    explanation:
      "Correspondent banking pairs: 'Nostro' (our account with you, e.g. Sonali Bank's USD account at Citibank NY), 'Vostro' (your account with us), and 'Loro' (third-party bank's account).",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["nostro-vostro", "forex", "bank-officer"],
  },
  {
    question:
      "What does 'MICR' printed along the bottom band of modern Bangladeshi bank cheques stand for?",
    options: [
      "Magnetic Ink Character Recognition",
      "Micro Integrated Clearing Receipt",
      "Monthly Interest Calculation Register",
      "Manual International Cheque Routing",
    ],
    correctIndex: 0,
    explanation:
      "MICR (Magnetic Ink Character Recognition) encodes cheque number, bank/branch routing code, and account number in special magnetic ink for automated clearing through Bangladesh Automated Clearing House (BACH).",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer (Cash) Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["micr", "bach", "cheque", "bank-cash"],
  },
  {
    question:
      "Bangladesh Bank is the central clearing house, whereas 'New Development Bank' (NDB) with its headquarters in Shanghai was jointly established by which intergovernmental bloc?",
    options: [
      "BRICS (Brazil, Russia, India, China, South Africa — Bangladesh joined NDB as a member in 2021)",
      "European Union (EU)",
      "ASEAN",
      "SAARC",
    ],
    correctIndex: 0,
    explanation:
      "The BRICS-founded New Development Bank (headquartered in Shanghai, China) admitted Bangladesh as one of its first new members in 2021.",
    subject: "International Affairs",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer GK",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["ndb", "brics", "international-banking"],
  },
  {
    question:
      "Where is the permanent Secretariat of BIMSTEC (Bay of Bengal Initiative for Multi-Sectoral Technical and Economic Cooperation) located?",
    options: [
      "Dhaka, Bangladesh (Gulshan-2)",
      "Kathmandu, Nepal (SAARC Secretariat)",
      "Bangkok, Thailand",
      "Colombo, Sri Lanka",
    ],
    correctIndex: 0,
    explanation:
      "BIMSTEC (formed 1997, 7 members around the Bay of Bengal) has its permanent Secretariat in Dhaka, Bangladesh (opened 2014). Kathmandu hosts the SAARC Secretariat.",
    subject: "International Affairs",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer GK",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["bimstec", "dhaka", "international-affairs"],
  },
  {
    question:
      "'অর্বাচীন' এবং 'খাতক' শব্দ দুটির সঠিক বিপরীত শব্দ যথাক্রমে কী?",
    options: [
      "প্রাচীন ও মহাজন",
      "নবীন ও ঋণী",
      "আধুনিক ও ব্যবসায়ী",
      "জ্ঞানবান ও গ্রাহক",
    ],
    correctIndex: 0,
    explanation:
      "'অর্বাচীন' (আধুনিক/অল্পবয়সী/অজ্ঞ) শব্দের বিপরীত 'প্রাচীন' এবং 'খাতক' (ঋণগ্রহীতা) শব্দের বিপরীত 'মহাজন' (ঋণদাতা/পাওনাদার)।",
    subject: "Bangla",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer Bangla",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["biporit-shobdo", "bangla", "bank-officer"],
  },
  {
    question:
      "বাংলা সাহিত্যে 'সনেট' (চতুর্দশপদী কবিতা)-এর প্রবর্তক এবং 'অমিত ও লাবণ্য' কোন বিখ্যাত বাংলা উপন্যাসের প্রধান দুটি চরিত্র?",
    options: [
      "সনেটের প্রবর্তক মাইকেল মধুসূদন দত্ত; 'অমিত ও লাবণ্য' রবীন্দ্রনাথ ঠাকুরের 'শেষের কবিতা' উপন্যাসের চরিত্র",
      "কাজী নজরুল ইসলাম; 'অমিত ও লাবণ্য' শরৎচন্দ্রের 'দেবদাস' উপন্যাসের চরিত্র",
      "বিহারীলাল চক্রবর্তী; 'চোখের বালি' উপন্যাসের চরিত্র",
      "জসীমউদ্দীন; 'নকশী কাঁথার মাঠ'-এর চরিত্র",
    ],
    correctIndex: 0,
    explanation:
      "বাংলায় চতুর্দশপদী কবিতাবলী (সনেট)-র প্রবর্তক মাইকেল মধুসূদন দত্ত। অমিত রায়, লাবণ্য ও শোভনলাল রবীন্দ্রনাথের কাব্যধর্মী উপন্যাস 'শেষের কবিতা' (১৯২৯)-র প্রধান চরিত্র।",
    subject: "Bangla",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer Bangla",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["sonnet", "shesher-kobita", "literature"],
  },
  {
    question:
      "নিচের কোন বাগধারাটির অর্থ 'তোষামুদে / চাটুকার' এবং কোনটির অর্থ 'সুসময়ের বন্ধু'?",
    options: [
      "'খয়ের খাঁ' (তোষামুদে) ও 'বসন্তের কোকিল' / 'দুধের মাছি' (সুসময়ের বন্ধু)",
      "'আকাশ কুসুম' ও 'রুই-কাতলা'",
      "'কাঁঠালের আমসত্ত্ব' ও 'তামার বিষ'",
      "'গোঁফ খেজুরে' ও 'অমাবস্যার চাঁদ'",
    ],
    correctIndex: 0,
    explanation:
      "বাগধারা: 'খয়ের খাঁ' = চাটুকার/তোষামোদকারী; 'বসন্তের কোকিল' / 'সুখের পায়রা' / 'দুধের মাছি' = সুসময়ের বন্ধু।",
    subject: "Bangla",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Combined Bank Officer (Cash) Archive",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["bagdhara", "bangla", "bank-cash"],
  },
  {
    question:
      "বাংলাদেশ ব্যাংকের 'RTGS' (Real Time Gross Settlement) সিস্টেমের মাধ্যমে ন্যূনতম কত টাকার বা তার বেশি মূল্যের আন্তঃব্যাংক লেনদেন তাৎক্ষণিকভাবে নিষ্পত্তি হয়?",
    options: [
      "১,০০,০০০ টাকা (১ লক্ষ টাকা) বা তার বেশি মূল্যের উচ্চ-মূল্যের লেনদেন",
      "মাত্র ১০০ টাকা থেকে সীমাবদ্ধ",
      "কমপক্ষে ১ কোটি টাকা",
      "শুধুমাত্র বৈদেশিক ডলার ছাড়া টাকায় কাজ করে না",
    ],
    correctIndex: 0,
    explanation:
      "২০১৫ সালে চালুকৃত বাংলাদেশ ব্যাংকের RTGS সিস্টেম সাধারণত ১ লক্ষ টাকা বা তদূর্ধ্ব (High-Value) আন্তঃব্যাংক লেনদেন কোনো ব্যাচ অপেক্ষা ছাড়াই Real Time-এ নিষ্পত্তি করে (BEFTN তুলনামূলক কম মূল্যের ব্যাচ নিষ্পত্তির জন্য)।",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Combined Bank Officer Banking",
    examSeries: "Combined Bank Officer & Cash (2018-2024) Archive",
    tags: ["rtgs", "beftn", "banking", "bank-cash"],
  },
];
