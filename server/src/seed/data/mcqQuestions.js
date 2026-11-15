import { extraMcqQuestions } from "./extraMcqQuestions.js";
import { bcsPastArchiveMcqs } from "./mcqs/bcsPastArchiveMcqs.js";
import { ministryPostOfficeMcqs } from "./mcqs/ministryPostOfficeMcqs.js";
import { primaryNtrcaArchiveMcqs } from "./mcqs/primaryNtrcaArchiveMcqs.js";
import { bankAndRulesArchiveMcqs } from "./mcqs/bankAndRulesArchiveMcqs.js";
import { deepCoverageArchiveMcqs } from "./mcqs/deepCoverageArchiveMcqs.js";

export const mcqQuestionsData = [
  // --- Govt Job Rules & Banking (2026 Rules) ---
  {
    question:
      "Under the reformed 2024–2026 Bangladesh Government recruitment rules, what is the standard maximum entry age for BCS and direct government jobs?",
    options: ["30 years", "32 years", "33 years", "35 years"],
    correctIndex: 1,
    explanation:
      "Following the late-2024 statutory amendment by the Ministry of Public Administration, the standard maximum entry age for BCS and direct government/autonomous recruitment was raised from 30 to 32 years.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Govt Rules 2026",
    difficulty: "Easy",
    sourceYear: "2026 Rules",
    tags: ["age-limit", "bcs", "mopa"],
  },
  {
    question:
      "How many times can an eligible candidate sit for the BCS examination within the 21–32 age bracket under the official BPSC gazette?",
    options: [
      "Maximum 3 times",
      "Maximum 4 times",
      "Maximum 5 times",
      "Unlimited times within the eligible age limit",
    ],
    correctIndex: 3,
    explanation:
      "Although 3-attempt and 4-attempt caps were briefly discussed in October 2024, the final gazette dropped the cap following BPSC recommendations—allowing unlimited attempts within the 21–32 age window.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Govt Rules 2026",
    difficulty: "Medium",
    sourceYear: "2026 Rules",
    tags: ["bcs-attempts", "bpsc"],
  },
  {
    question:
      "Under the July 23, 2024 Quota Reform Gazette, what percentage of total vacancies in direct government recruitment is allocated strictly to Merit?",
    options: ["85%", "90%", "93%", "95%"],
    correctIndex: 2,
    explanation:
      "The July 2024 gazette allocated 93% to Merit, 5% to children of Freedom Fighters/Biranganas, 1% to Ethnic Minorities, and 1% to Persons with Disabilities & Third Gender.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Govt Rules 2026",
    difficulty: "Easy",
    sourceYear: "2024-2026 Gazette",
    tags: ["quota", "merit"],
  },
  {
    question:
      "Under the Service (Pay and Allowances) Order, 2026 (9th National Pay Scale), what is the starting basic salary for Grade 9 (BCS Cadre entry)?",
    options: ["৳22,000", "৳36,000", "৳44,000", "৳52,000"],
    correctIndex: 2,
    explanation:
      "The 9th National Pay Scale 2026 doubled the Grade 9 entry basic salary from ৳22,000 (2015 scale) to ৳44,000, phased in fully by July 1, 2027.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Govt Rules 2026",
    difficulty: "Medium",
    sourceYear: "9th Pay Scale 2026",
    tags: ["pay-scale", "grade-9"],
  },
  {
    question:
      "What is the starting basic salary of Grade 20 under the 9th National Pay Scale (2026)?",
    options: ["৳8,250", "৳15,000", "৳20,000", "৳24,000"],
    correctIndex: 2,
    explanation:
      "Grade 20 entry basic pay increased from ৳8,250 (2015 scale) to ৳20,000 under the Service (Pay and Allowances) Order, 2026.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Govt Rules 2026",
    difficulty: "Medium",
    sourceYear: "9th Pay Scale 2026",
    tags: ["pay-scale", "grade-20"],
  },
  {
    question:
      "In the BCS Preliminary Examination, how many marks are deducted for each incorrect answer?",
    options: ["0.25 marks", "0.33 marks", "0.50 marks", "1.00 mark"],
    correctIndex: 2,
    explanation:
      "BPSC deducts 0.50 marks per wrong answer in the 200-mark BCS Preliminary MCQ exam (meaning two wrong answers cancel one correct mark).",
    subject: "Govt Job Rules & Banking",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BPSC Standard",
    tags: ["negative-marking", "bcs"],
  },
  {
    question:
      "What are the standard pixel dimensions required for the Applicant's Signature on Teletalk government job portals?",
    options: ["300 x 300 px", "300 x 80 px", "200 x 100 px", "400 x 120 px"],
    correctIndex: 1,
    explanation:
      "Teletalk portals enforce 300 x 300 px for the applicant's photograph and 300 x 80 px for the scanned signature.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Grade 11-20",
    difficulty: "Easy",
    sourceYear: "Teletalk Spec",
    tags: ["teletalk", "application"],
  },
  {
    question:
      "Which portal centrally manages applications for state-owned commercial and specialized banks under the Bankers' Selection Committee (BSC)?",
    options: [
      "bpsc.teletalk.com.bd",
      "erecruitment.bb.org.bd",
      "mopa.gov.bd",
      "ntrca.gov.bd",
    ],
    correctIndex: 1,
    explanation:
      "Bangladesh Bank's e-Recruitment portal (erecruitment.bb.org.bd) maintains the centralized CV ID system and publishes circulars for both Bangladesh Bank and BSC combined bank panels.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "BB Rules",
    tags: ["bank", "bb-bsc"],
  },
  {
    question: "Which institution serves as the central bank and monetary authority of Bangladesh?",
    options: ["Sonali Bank PLC", "Bangladesh Bank", "BSEC", "NBR"],
    correctIndex: 1,
    explanation:
      "Bangladesh Bank (established under the Bangladesh Bank Order, 1972) is the central bank regulating monetary policy, foreign exchange reserves, and scheduled banks.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Bank Model Test",
    tags: ["banking", "central-bank"],
  },
  {
    question: "What does 'CAMELS' rating evaluate in banking supervision?",
    options: [
      "Foreign exchange remittances only",
      "Soundness and financial health of a bank",
      "Agricultural loan subsidies",
      "Stock market IPO eligibility",
    ],
    correctIndex: 1,
    explanation:
      "CAMELS stands for Capital adequacy, Asset quality, Management, Earnings, Liquidity, and Sensitivity to market risk—used by central banks to rate bank soundness.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Bank Model Test",
    tags: ["camels", "banking"],
  },

  // --- Bangla ---
  {
    question: "বাংলা সাহিত্যের আদি নিদর্শন 'চর্যাপদ' কোন ভাষায় রচিত?",
    options: [
      "প্রাচীন ব্রজবুলি",
      "প্রাচীন বাংলা / সান্ধ্য ভাষা",
      "সংস্কৃত মিশ্রিত পালি",
      "আধুনিক সাধু বাংলা",
    ],
    correctIndex: 1,
    explanation:
      "চর্যাপদ প্রাচীন বাংলা ভাষার আদি নিদর্শন এবং এর রূপক ও দুর্বোধ্য রচনাশৈলীকে 'সান্ধ্য ভাষা' (আলো-আঁধারি ভাষা) বলা হয়।",
    subject: "Bangla",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BCS Past Pattern",
    tags: ["bangla-literature", "charyapada"],
  },
  {
    question: "কোন বানানটি শুদ্ধ?",
    options: ["মুমূর্ষ", "মুমূর্ষু", "মুমুর্ষু", "মূমুর্ষু"],
    correctIndex: 1,
    explanation:
      "প্রমিত বাংলা বানান অনুযায়ী সঠিক বানান হলো 'মুমূর্ষু' (প্রথম 'মু'-তে হ্রস্ব-উ কার, মাঝে 'মূ'-তে দীর্ঘ-ঊ কার, শেষে 'র্ষু'-তে হ্রস্ব-উ কার)।",
    subject: "Bangla",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BCS Past Pattern",
    tags: ["bangla-spelling", "grammar"],
  },
  {
    question: "'সিংহাসন' কোন সমাসের উদাহরণ?",
    options: [
      "দ্বন্দ্ব সমাস",
      "বহুব্রীহি সমাস",
      "মধ্যপদলোপী কর্মধারয় সমাস",
      "অব্যয়ীভাব সমাস",
    ],
    correctIndex: 2,
    explanation:
      "'সিংহ চিহ্নিত আসন = সিংহাসন'—ব্যাসবাক্যের মধ্যপদ 'চিহ্নিত' লোপ পাওয়ায় এটি মধ্যপদলোপী কর্মধারয় সমাস।",
    subject: "Bangla",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "NCTB 9-10",
    tags: ["samas", "grammar"],
  },
  {
    question: "'গবেষণা' শব্দের সঠিক সন্ধি-বিচ্ছেদ কোনটি?",
    options: ["গব + এষণা", "গো + এষণা", "গৌ + এষণা", "গো + অষণা"],
    correctIndex: 1,
    explanation:
      "স্বরসন্ধির নিয়মে 'গো + এষণা = গবেষণা' (ও-কারের পর ভিন্ন স্বর থাকলে 'অব্' হয়)।",
    subject: "Bangla",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "NCTB 9-10",
    tags: ["sandhi", "grammar"],
  },
  {
    question: "বাংলাদেশ জাতীয় সংগীত 'আমার সোনার বাংলা' কোন কাব্য/গীতিসংকলনের অন্তর্ভুক্ত?",
    options: ["গীতাঞ্জলি", "সঞ্চয়িতা", "স্বরবিতান", "বলাকা"],
    correctIndex: 2,
    explanation:
      "রবীন্দ্রনাথ ঠাকুরের রচিত 'আমার সোনার বাংলা' (১৯০৫ সালে বঙ্গভঙ্গের প্রেক্ষাপটে রচিত) তাঁর সংগীতসংকলন 'গীতবিতান' ও স্বরলিপি গ্রন্থ 'স্বরবিতান'-এ সংকলিত রয়েছে।",
    subject: "Bangla",
    examTrack: "Primary & NTRCA",
    difficulty: "Medium",
    sourceYear: "BCS Pattern",
    tags: ["rabindranath", "bangla-literature"],
  },
  {
    question: "বাংলা ভাষায় প্রথম সাময়িকপত্র কোনটি?",
    options: ["সমাচার দর্পণ", "তত্ত্ববোধিনী পত্রিকা", "দিগদর্শন", "বঙ্গদর্শন"],
    correctIndex: 2,
    explanation:
      "১৮১৮ সালের এপ্রিল মাসে জন ক্লার্ক মার্শম্যানের সম্পাদনায় প্রকাশিত 'দিগদর্শন' বাংলা ভাষার প্রথম সাময়িকপত্র (মাসিক); এরপর মে ১৮১৮-তে প্রথম সাপ্তাহিক 'সমাচার দর্পণ' প্রকাশিত হয়।",
    subject: "Bangla",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BCS Past Pattern",
    tags: ["bangla-literature", "periodicals"],
  },
  {
    question: "'উদাসীন পথিকের মনের কথা' কার রচনা?",
    options: [
      "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
      "মীর মশাররফ হোসেন",
      "বেগম রোকেয়া",
      "কাজী নজরুল ইসলাম",
    ],
    correctIndex: 1,
    explanation:
      "মীর মশাররফ হোসেন ১৮৯০ সালে নীলবিদ্রোহ ও ব্যক্তিগত অভিজ্ঞতার পটভূমিতে 'উদাসীন পথিকের মনের কথা' রচনা করেন।",
    subject: "Bangla",
    examTrack: "Primary & NTRCA",
    difficulty: "Medium",
    sourceYear: "Primary Model Test",
    tags: ["bangla-literature"],
  },

  // --- English ---
  {
    question:
      "Identify the underlined clause: 'I know the place where he lives.' ('where he lives')",
    options: [
      "Noun Clause",
      "Adjective Clause",
      "Adverbial Clause of Place",
      "Principal Clause",
    ],
    correctIndex: 1,
    explanation:
      "Because 'where he lives' modifies the antecedent noun 'the place', it functions as an Adjective (Relative) Clause—not an Adverbial Clause.",
    subject: "English",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BCS Past Pattern",
    tags: ["clauses", "grammar"],
  },
  {
    question:
      "Choose the correct conditional sentence: 'Had I possessed the wings of a bird, I ___.'",
    options: ["would fly", "will fly", "would have flown", "flew"],
    correctIndex: 2,
    explanation:
      "'Had I possessed...' is an inverted Third Conditional (Past Perfect), which requires 'would have + past participle (flown)' in the main clause.",
    subject: "English",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BCS Past Pattern",
    tags: ["conditionals", "grammar"],
  },
  {
    question: "Who wrote the dystopian novel 'Nineteen Eighty-Four (1984)'?",
    options: [
      "Aldous Huxley",
      "George Orwell",
      "H. G. Wells",
      "Ernest Hemingway",
    ],
    correctIndex: 1,
    explanation:
      "George Orwell (Eric Arthur Blair) published '1984' in 1949, introducing terms like 'Big Brother' and 'Doublethink'.",
    subject: "English",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BCS Past Pattern",
    tags: ["english-literature", "modern-period"],
  },
  {
    question:
      "Select the appropriate preposition: 'She is endowed ___ extraordinary musical talent.'",
    options: ["by", "with", "of", "for"],
    correctIndex: 1,
    explanation:
      "'Endowed with' is the standard appropriate preposition meaning naturally gifted or provided with a quality.",
    subject: "English",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Bank & BCS",
    tags: ["prepositions", "vocabulary"],
  },
  {
    question: "What does the idiom 'Once in a blue moon' mean?",
    options: [
      "Every full moon night",
      "Very rarely",
      "With full enthusiasm",
      "Unexpectedly dangerous",
    ],
    correctIndex: 1,
    explanation:
      "'Once in a blue moon' means something that happens very rarely or almost never.",
    subject: "English",
    examTrack: "Grade 11-20",
    difficulty: "Easy",
    sourceYear: "Standard Idioms",
    tags: ["idioms"],
  },
  {
    question: "Choose the correct passive form of: 'Who taught you English?'",
    options: [
      "By whom were you taught English?",
      "By whom you were taught English?",
      "Who was taught you English?",
      "Whom were you taught English by?",
    ],
    correctIndex: 0,
    explanation:
      "Interrogative passive starting with 'Who' converts to 'By whom + auxiliary verb + subject + past participle'.",
    subject: "English",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "Primary Model Test",
    tags: ["voice", "grammar"],
  },
  {
    question: "What is the synonym of the word 'Ubiquitous'?",
    options: ["Scarce", "Omnipresent", "Obsolete", "Ambiguous"],
    correctIndex: 1,
    explanation:
      "'Ubiquitous' means present, appearing, or found everywhere—synonymous with 'Omnipresent'.",
    subject: "English",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Bank Vocabulary",
    tags: ["vocabulary", "synonyms"],
  },
  {
    question: "Who is considered the 'Poet of Nature' in English Literature?",
    options: [
      "John Keats",
      "William Wordsworth",
      "P. B. Shelley",
      "Samuel Taylor Coleridge",
    ],
    correctIndex: 1,
    explanation:
      "William Wordsworth, co-author of 'Lyrical Ballads' (1798), is universally celebrated as the Poet of Nature in the Romantic Period.",
    subject: "English",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "English Literature",
    tags: ["romantic-period", "english-literature"],
  },

  // --- Bangladesh Affairs ---
  {
    question:
      "Which Article of the Constitution of Bangladesh establishes the Bangladesh Public Service Commission (BPSC)?",
    options: ["Article 118", "Article 127", "Article 137", "Article 142"],
    correctIndex: 2,
    explanation:
      "Article 137 provides for the establishment of Public Service Commissions (while Art. 118 establishes Election Commission and Art. 127 establishes CAG).",
    subject: "Bangladesh Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "Constitution",
    tags: ["constitution", "bpsc"],
  },
  {
    question:
      "During the 1971 Liberation War of Bangladesh, into how many operational sectors was the country divided?",
    options: ["7 Sectors", "9 Sectors", "11 Sectors", "12 Sectors"],
    correctIndex: 2,
    explanation:
      "Bangladesh was divided into 11 Sectors under the Mujibnagar Government (with Sector 10 operating as the Naval Commando sector without fixed land boundaries).",
    subject: "Bangladesh Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "History",
    tags: ["liberation-war", "1971"],
  },
  {
    question:
      "On which date was the historic Six-Point Demand (ছয় দফা) formally launched in Lahore?",
    options: [
      "5 February 1966",
      "23 March 1966",
      "7 June 1966",
      "21 February 1952",
    ],
    correctIndex: 0,
    explanation:
      "The Six-Point Demand was presented on 5–6 February 1966 in Lahore and formally adopted on 23 March 1966; 7 June 1966 was observed as Six-Point Day.",
    subject: "Bangladesh Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "History",
    tags: ["six-point", "history"],
  },
  {
    question:
      "Which Article of the Constitution of Bangladesh declares the supremacy of the Constitution as the solemn expression of the will of the people?",
    options: ["Article 1", "Article 7", "Article 11", "Article 27"],
    correctIndex: 1,
    explanation:
      "Article 7 states that all powers in the Republic belong to the people and that this Constitution is the supreme law of the Republic.",
    subject: "Bangladesh Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "Constitution",
    tags: ["constitution"],
  },
  {
    question:
      "Where was the provisional Mujibnagar Government sworn in on 17 April 1971?",
    options: [
      "Chuadanga",
      "Baidyanathtala (Meherpur)",
      "Jessore Cantonment",
      "Agartala",
    ],
    correctIndex: 1,
    explanation:
      "The Mujibnagar Government took oath on 17 April 1971 at Baidyanathtala mango grove in Meherpur (later renamed Mujibnagar).",
    subject: "Bangladesh Affairs",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "History",
    tags: ["mujibnagar", "1971"],
  },
  {
    question: "Which Article of the Constitution guarantees Equality before Law for all citizens?",
    options: ["Article 26", "Article 27", "Article 31", "Article 39"],
    correctIndex: 1,
    explanation:
      "Article 27 states: 'All citizens are equal before law and are entitled to equal protection of law.'",
    subject: "Bangladesh Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "Constitution",
    tags: ["constitution", "fundamental-rights"],
  },
  {
    question: "Which is the largest mangrove forest in the world, located across southwestern Bangladesh?",
    options: ["Lawachara", "Ratargul", "The Sundarbans", "Madhupur"],
    correctIndex: 2,
    explanation:
      "The Sundarbans is the world's largest single-tract mangrove forest and a UNESCO World Heritage Site (designated in 1997).",
    subject: "Bangladesh Affairs",
    examTrack: "Grade 11-20",
    difficulty: "Easy",
    sourceYear: "Grade 11-20 Model",
    tags: ["sundarbans", "bangladesh"],
  },

  // --- International Affairs ---
  {
    question: "Where is the headquarters of the International Court of Justice (ICJ) located?",
    options: [
      "Geneva, Switzerland",
      "New York, USA",
      "The Hague, Netherlands",
      "Vienna, Austria",
    ],
    correctIndex: 2,
    explanation:
      "The ICJ is the only principal organ of the United Nations located outside New York, headquartered at the Peace Palace in The Hague, Netherlands.",
    subject: "International Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "UN & Orgs",
    tags: ["un", "icj"],
  },
  {
    question:
      "Which organization was established by the 1994 Marrakesh Agreement as the successor to GATT?",
    options: ["IMF", "World Bank", "WTO", "UNCTAD"],
    correctIndex: 2,
    explanation:
      "The World Trade Organization (WTO) was established by the Marrakesh Agreement (1994) and officially began operations on 1 January 1995, replacing GATT.",
    subject: "International Affairs",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Global Economy",
    tags: ["wto", "economics"],
  },
  {
    question: "Which city hosts the permanent Secretariat of BIMSTEC?",
    options: ["Bangkok", "Kathmandu", "Dhaka", "Colombo"],
    correctIndex: 2,
    explanation:
      "The BIMSTEC (Bay of Bengal Initiative for Multi-Sectoral Technical and Economic Cooperation) permanent Secretariat is located in Gulshan, Dhaka, Bangladesh.",
    subject: "International Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "Regional Orgs",
    tags: ["bimstec", "dhaka"],
  },
  {
    question: "When did Bangladesh join the United Nations as its 136th member?",
    options: [
      "16 December 1971",
      "17 September 1974",
      "25 September 1974",
      "4 November 1972",
    ],
    correctIndex: 1,
    explanation:
      "Bangladesh was admitted to the United Nations on 17 September 1974 as the 136th member state.",
    subject: "International Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "UN",
    tags: ["un", "bangladesh"],
  },
  {
    question: "What is the headquarters of the Asian Infrastructure Investment Bank (AIIB)?",
    options: ["Manila", "Beijing", "Tokyo", "Singapore"],
    correctIndex: 1,
    explanation:
      "AIIB is headquartered in Beijing, China (while ADB is headquartered in Manila, Philippines).",
    subject: "International Affairs",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Bank Model Test",
    tags: ["aiib", "banking"],
  },

  // --- Math & Mental Ability ---
  {
    question:
      "If the price of an item is increased by 20% and then decreased by 20%, what is the net percentage change?",
    options: ["No change (0%)", "4% increase", "4% decrease", "2% decrease"],
    correctIndex: 2,
    explanation:
      "Using successive percentage formula: (+20) + (-20) + (20 × -20)/100 = -4%. Thus, there is a net 4% decrease.",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Quantitative",
    tags: ["percentage", "arithmetic"],
  },
  {
    question:
      "What is the angle between the hour hand and the minute hand of a clock at 3:30?",
    options: ["60°", "75°", "82.5°", "90°"],
    correctIndex: 1,
    explanation: "Angle = |30H - 5.5M| = |30(3) - 5.5(30)| = |90 - 165| = 75°.",
    subject: "Math & Mental Ability",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "Mental Ability",
    tags: ["clock", "mental-ability"],
  },
  {
    question:
      "A sum of money doubles itself in 8 years at simple interest. What is the annual rate of interest?",
    options: ["10%", "12%", "12.5%", "15%"],
    correctIndex: 2,
    explanation:
      "For Principal P to double (Interest I = P) in 8 years: R = (100 × I) / (P × T) = 100 / 8 = 12.5%.",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Arithmetic",
    tags: ["interest", "math"],
  },
  {
    question: "Find the missing number in the series: 2, 6, 12, 20, 30, ?",
    options: ["38", "40", "42", "44"],
    correctIndex: 2,
    explanation:
      "Differences increase by 2 each step: +4, +6, +8, +10, +12. So 30 + 12 = 42 (or n(n+1) for n=6 -> 6×7 = 42).",
    subject: "Math & Mental Ability",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "Mental Ability",
    tags: ["number-series"],
  },
  {
    question: "If x + 1/x = 5, what is the value of x² + 1/x²?",
    options: ["21", "23", "25", "27"],
    correctIndex: 1,
    explanation: "x² + 1/x² = (x + 1/x)² - 2 = 5² - 2 = 25 - 2 = 23.",
    subject: "Math & Mental Ability",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "Algebra",
    tags: ["algebra"],
  },
  {
    question:
      "A train 150 meters long passes a pole in 15 seconds. What is its speed in km/h?",
    options: ["30 km/h", "36 km/h", "40 km/h", "45 km/h"],
    correctIndex: 1,
    explanation: "Speed = 150 / 15 = 10 m/s. Converting to km/h: 10 × (18/5) = 36 km/h.",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Time & Distance",
    tags: ["train", "arithmetic"],
  },
  {
    question:
      "If A can finish a task in 12 days and B can finish it in 24 days, in how many days will they finish working together?",
    options: ["6 days", "8 days", "9 days", "10 days"],
    correctIndex: 1,
    explanation: "Combined rate = 1/12 + 1/24 = 3/24 = 1/8 per day. Together they take 8 days.",
    subject: "Math & Mental Ability",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "Work & Time",
    tags: ["work-time", "math"],
  },

  // --- General Science & ICT ---
  {
    question: "What is the binary equivalent of the decimal number 25?",
    options: ["10101", "11001", "11011", "10011"],
    correctIndex: 1,
    explanation: "25 = 16 + 8 + 1 = 1×2⁴ + 1×2³ + 0×2² + 0×2¹ + 1×2⁰ = 11001₂.",
    subject: "General Science & ICT",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "HSC ICT",
    tags: ["ict", "binary"],
  },
  {
    question: "Which layer of the OSI Model is responsible for IP addressing and packet routing?",
    options: [
      "Data Link Layer (Layer 2)",
      "Network Layer (Layer 3)",
      "Transport Layer (Layer 4)",
      "Session Layer (Layer 5)",
    ],
    correctIndex: 1,
    explanation:
      "The Network Layer (Layer 3) handles logical IP addressing and routing packets across networks.",
    subject: "General Science & ICT",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "Computer & IT",
    tags: ["networking", "osi"],
  },
  {
    question: "Which human blood group is known as the 'Universal Donor' for red blood cells?",
    options: ["AB+", "AB-", "O+", "O-"],
    correctIndex: 3,
    explanation:
      "O-negative (O-) red blood cells lack A, B, and Rh antigens, making them safe for emergency transfusion across blood types.",
    subject: "General Science & ICT",
    examTrack: "Grade 11-20",
    difficulty: "Easy",
    sourceYear: "General Science",
    tags: ["biology", "science"],
  },
  {
    question: "What is the pH value of pure neutral water at 25°C?",
    options: ["0", "5.5", "7", "14"],
    correctIndex: 2,
    explanation:
      "Pure water at 25°C has equal H⁺ and OH⁻ concentrations (10⁻⁷ M), giving a neutral pH of 7.",
    subject: "General Science & ICT",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "Chemistry",
    tags: ["chemistry", "science"],
  },
  {
    question: "In MS Excel, which function looks up a value in the leftmost column of a table and returns a value in the same row from a specified column?",
    options: ["COUNTIF", "VLOOKUP", "SUMIF", "CONCAT"],
    correctIndex: 1,
    explanation:
      "VLOOKUP (Vertical Lookup) is a staple question in both Grade 11–20 practical/written tests and BCS Computer & IT MCQs.",
    subject: "General Science & ICT",
    examTrack: "Grade 11-20",
    difficulty: "Easy",
    sourceYear: "MS Office Practical",
    tags: ["excel", "ict"],
  },
  {
    question: "Deficiency of which vitamin causes Scurvy (bleeding gums)?",
    options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
    correctIndex: 2,
    explanation:
      "Vitamin C (Ascorbic Acid) deficiency impairs collagen synthesis and causes Scurvy.",
    subject: "General Science & ICT",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "NCTB Science",
    tags: ["vitamins", "biology"],
  },

  // --- Ethics & Governance ---
  {
    question:
      "Which of the following is NOT listed among the World Bank's core indicators of Good Governance?",
    options: [
      "Voice and Accountability",
      "Rule of Law",
      "Control of Corruption",
      "Absolute Secrecy of Public Budgets",
    ],
    correctIndex: 3,
    explanation:
      "Good Governance emphasizes Fiscal Transparency and Right to Information—not budget secrecy. Voice & Accountability, Rule of Law, and Control of Corruption are core World Bank governance indicators.",
    subject: "Ethics & Governance",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "Ethics 15 Marks",
    tags: ["governance", "ethics"],
  },
  {
    question:
      "In public administration, what is the primary purpose of a 'Citizen's Charter' (নাগরিক সনদ)?",
    options: [
      "Restricting public access to government offices",
      "Specifying service standards, fees, and timelines owed to citizens",
      "Replacing the national constitution",
      "Managing internal salary increments",
    ],
    correctIndex: 1,
    explanation:
      "A Citizen's Charter publicly commits a government office to transparent service delivery standards, processing timelines, fees, and grievance redressal.",
    subject: "Ethics & Governance",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "Ethics 15 Marks",
    tags: ["governance", "citizens-charter"],
  },
  {
    question: "In which year did Bangladesh enact the Right to Information (RTI) Act?",
    options: ["2007", "2009", "2012", "2015"],
    correctIndex: 1,
    explanation:
      "The Right to Information Act (তথ্য অধিকার আইন) was passed by Parliament in 2009 to promote transparency and accountability across public offices.",
    subject: "Ethics & Governance",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "Ethics 15 Marks",
    tags: ["rti", "governance"],
  },

  // --- Geography & Environment ---
  {
    question:
      "Which atmospheric layer contains the Ozone Layer that absorbs harmful UV radiation?",
    options: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"],
    correctIndex: 1,
    explanation:
      "The Stratosphere (approx. 10–50 km altitude) contains the protective Ozone Layer.",
    subject: "Geography & Environment",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "Geography 10 Marks",
    tags: ["environment", "atmosphere"],
  },
  {
    question: "Through which district does the Brahmaputra (Jamuna) enter Bangladesh?",
    options: ["Sylhet", "Kurigram", "Panchagarh", "Chapainawabganj"],
    correctIndex: 1,
    explanation:
      "The Brahmaputra enters Bangladesh through Kurigram district (near Noonkhawa/Chilmari) and flows southward as the Jamuna.",
    subject: "Geography & Environment",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BD Geography",
    tags: ["rivers", "geography"],
  },
  {
    question: "Where does the Padma River meet the Meghna River in Bangladesh?",
    options: ["Goalundo", "Chandpur", "Bhairab Bazar", "Aricha"],
    correctIndex: 1,
    explanation:
      "The Padma and Jamuna converge near Goalundo/Aricha, and the combined Padma meets the Meghna at Chandpur.",
    subject: "Geography & Environment",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "BD Geography",
    tags: ["rivers", "geography"],
  },

  // --- Past Paper "Job Solution" Archive Sets ---
  {
    question: "বাংলা সাহিত্যের 'চর্যাপদ' কত খ্রিস্টাব্দে নেপালের রাজগ্রন্থশালা থেকে আবিষ্কৃত হয়?",
    options: ["১৯০৫", "১৯০৭", "১৯১৬", "১৯২১"],
    correctIndex: 1,
    explanation:
      "মহামহোপাধ্যায় হরপ্রসাদ শাস্ত্রী ১৯০৭ সালে নেপালের রাজদরবারের গ্রন্থশালা থেকে চর্যাপদ আবিষ্কার করেন এবং ১৯১৬ সালে বঙ্গীয় সাহিত্য পরিষদ থেকে প্রকাশ করেন।",
    subject: "Bangla",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BCS Prelims Archive",
    examSeries: "46th BCS Preliminary Archive",
    tags: ["charyapada", "bangla-literature", "past-paper"],
  },
  {
    question: "Which Shakespearean tragedy contains the famous soliloquy 'To be, or not to be, that is the question'?",
    options: ["Macbeth", "Othello", "Hamlet", "King Lear"],
    correctIndex: 2,
    explanation:
      "Prince Hamlet delivers this soliloquy in Act 3, Scene 1 of William Shakespeare's tragedy 'Hamlet'.",
    subject: "English",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BCS Prelims Archive",
    examSeries: "46th BCS Preliminary Archive",
    tags: ["shakespeare", "english-literature", "past-paper"],
  },
  {
    question: "বাংলাদেশ সংবিধানের কোন অনুচ্ছেদে 'বাংলাদেশ সরকারি কর্ম কমিশন (BPSC)' প্রতিষ্ঠার বিধান রয়েছে?",
    options: ["অনুচ্ছেদ ১১৮", "অনুচ্ছেদ ১২৭", "অনুচ্ছেদ ১৩৭", "অনুচ্ছেদ ১৪২"],
    correctIndex: 2,
    explanation:
      "বাংলাদেশ সংবিধানের নবম ভাগের ২য় পরিচ্ছেদের অনুচ্ছেদ ১৩৭-এ বাংলাদেশ সরকারি কর্ম কমিশন (BPSC) প্রতিষ্ঠার বিধান উল্লেখ রয়েছে।",
    subject: "Bangladesh Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BCS Prelims Archive",
    examSeries: "46th BCS Preliminary Archive",
    tags: ["constitution", "bpsc", "article-137"],
  },
  {
    question: "If x + 1/x = 4, what is the value of x² + 1/x²?",
    options: ["12", "14", "16", "18"],
    correctIndex: 1,
    explanation:
      "Using the standard algebraic identity (x + 1/x)² - 2 = 4² - 2 = 16 - 2 = 14.",
    subject: "Math & Mental Ability",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BCS Prelims Archive",
    examSeries: "46th BCS Preliminary Archive",
    tags: ["algebra", "shortcut", "past-paper"],
  },
  {
    question: "In Boolean algebra, which pair of logic gates are known as 'Universal Gates'?",
    options: ["AND and OR", "NAND and NOR", "XOR and XNOR", "NOT and AND"],
    correctIndex: 1,
    explanation:
      "NAND and NOR gates are called Universal Gates because any Boolean function or other basic gate (AND, OR, NOT) can be implemented using them alone.",
    subject: "General Science & ICT",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BCS Prelims Archive",
    examSeries: "46th BCS Preliminary Archive",
    tags: ["ict", "logic-gates", "past-paper"],
  },

  {
    question: "'মনীষা' শব্দের সঠিক সন্ধি বিচ্ছেদ কোনটি?",
    options: ["মন + ঈষা", "মনঃ + ঈষা", "মনস্ + ঈষা", "মনা + ঈষা"],
    correctIndex: 2,
    explanation:
      "'মনীষা' নিপাতনে সিদ্ধ স্বরসন্ধির উদাহরণ — এর সঠিক বিচ্ছেদ 'মনস্ + ঈষা'।",
    subject: "Bangla",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BCS Prelims Archive",
    examSeries: "45th BCS Preliminary Archive",
    tags: ["sandhi", "grammar", "past-paper"],
  },
  {
    question: "Fill in the blank: 'It is high time we ___ our study routine seriously.'",
    options: ["start", "started", "had started", "will start"],
    correctIndex: 1,
    explanation:
      "After 'It is time / It is high time + subject', English grammar requires the Past Simple (V2) form to express urgency in the present: 'started'.",
    subject: "English",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BCS Prelims Archive",
    examSeries: "45th BCS Preliminary Archive",
    tags: ["grammar", "right-form-of-verbs", "past-paper"],
  },
  {
    question: "১৯৭১ সালের মুক্তিযুদ্ধের সময় বাংলাদেশের সমগ্র রণাঙ্গনকে কয়টি সেক্টরে বিভক্ত করা হয়েছিল?",
    options: ["৭টি", "৯টি", "১০টি", "১১টি"],
    correctIndex: 3,
    explanation:
      "১৯৭১ সালের মহান মুক্তিযুদ্ধে সমগ্র বাংলাদেশকে ১১টি সেক্টরে বিভক্ত করা হয়; এর মধ্যে ১০ নম্বর সেক্টর ছিল নৌ-কমান্ডো সেক্টর।",
    subject: "Bangladesh Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Easy",
    sourceYear: "BCS Prelims Archive",
    examSeries: "45th BCS Preliminary Archive",
    tags: ["liberation-war", "sectors", "past-paper"],
  },
  {
    question: "Which principal organ of the United Nations is headquartered outside New York City (in The Hague, Netherlands)?",
    options: [
      "Security Council",
      "ECOSOC",
      "International Court of Justice (ICJ)",
      "Trusteeship Council",
    ],
    correctIndex: 2,
    explanation:
      "The International Court of Justice (ICJ) is located at the Peace Palace in The Hague, Netherlands, whereas all other five principal UN organs are in New York.",
    subject: "International Affairs",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BCS Prelims Archive",
    examSeries: "45th BCS Preliminary Archive",
    tags: ["un", "icj", "headquarters"],
  },
  {
    question: "In the OSI networking model, which layer is responsible for IP addressing and routing packets between networks?",
    options: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"],
    correctIndex: 1,
    explanation:
      "Layer 3 (Network Layer) handles logical IP addressing and packet routing through routers.",
    subject: "General Science & ICT",
    examTrack: "BCS Preliminary",
    difficulty: "Medium",
    sourceYear: "BCS Prelims Archive",
    examSeries: "45th BCS Preliminary Archive",
    tags: ["osi-model", "networking", "ict"],
  },

  {
    question: "What is the minimum Cash Reserve Ratio (CRR) conceptually designed for in Bangladesh Bank's monetary framework?",
    options: [
      "Retail loan interest ceiling",
      "Mandatory cash fraction commercial banks must keep with Bangladesh Bank",
      "Foreign tourist visa deposit",
      "Fiscal deficit bond pricing",
    ],
    correctIndex: 1,
    explanation:
      "CRR (Cash Reserve Ratio) is the mandatory proportion of commercial banks' total demand & time liabilities held in cash directly with Bangladesh Bank to control money supply and liquidity.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Bank AD / BSC Archive",
    examSeries: "Bangladesh Bank & Combined Bank Archive",
    tags: ["crr", "monetary-policy", "banking"],
  },
  {
    question: "A commodity price increases by 25%. By what percentage should a household reduce consumption to keep total expenditure unchanged?",
    options: ["15%", "20%", "22.5%", "25%"],
    correctIndex: 1,
    explanation:
      "Reduction % = [R / (100 + R)] × 100 = [25 / 125] × 100 = 20%.",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Medium",
    sourceYear: "Bank AD / BSC Archive",
    examSeries: "Bangladesh Bank & Combined Bank Archive",
    tags: ["percentage", "bank-math", "shortcut"],
  },
  {
    question: "Identify the correct meaning of the idiom 'A bolt from the blue':",
    options: [
      "A sunny morning",
      "A complete surprise or unexpected shock",
      "A carefully planned project",
      "A minor grammatical error",
    ],
    correctIndex: 1,
    explanation:
      "'A bolt from the blue' refers to a sudden, completely unexpected event or shock (like lightning out of a clear blue sky).",
    subject: "English",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Bank AD / BSC Archive",
    examSeries: "Bangladesh Bank & Combined Bank Archive",
    tags: ["idioms", "bank-english"],
  },
  {
    question: "Which organization grants Special Drawing Rights (SDR) as an international reserve asset?",
    options: [
      "World Bank",
      "Asian Development Bank (ADB)",
      "International Monetary Fund (IMF)",
      "World Trade Organization (WTO)",
    ],
    correctIndex: 2,
    explanation:
      "The IMF allocates Special Drawing Rights (SDR), backed by a basket of five major currencies (USD, EUR, CNY, JPY, GBP).",
    subject: "International Affairs",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Bank AD / BSC Archive",
    examSeries: "Bangladesh Bank & Combined Bank Archive",
    tags: ["imf", "sdr", "economy"],
  },
  {
    question: "Two taps can fill a tank in 10 hours and 15 hours respectively. If both are opened together, how long will they take to fill the tank?",
    options: ["5 hours", "6 hours", "7.5 hours", "8 hours"],
    correctIndex: 1,
    explanation:
      "Combined time = (xy) / (x + y) = (10 × 15) / (10 + 15) = 150 / 25 = 6 hours.",
    subject: "Math & Mental Ability",
    examTrack: "Bank Combined",
    difficulty: "Easy",
    sourceYear: "Bank AD / BSC Archive",
    examSeries: "Bangladesh Bank & Combined Bank Archive",
    tags: ["pipe-cistern", "work-time", "bank-math"],
  },

  {
    question: "'কাজলকালো' কোন কর্মধারয় সমাসের উদাহরণ?",
    options: [
      "উপমিত কর্মধারয়",
      "উপমান কর্মধারয়",
      "রূপক কর্মধারয়",
      "মধ্যপদলোপী কর্মধারয়",
    ],
    correctIndex: 1,
    explanation:
      "'কাজলের ন্যায় কালো' — এখানে সাধারণ গুণ (কালো) উল্লেখ থাকায় এটি উপমান কর্মধারয় সমাস।",
    subject: "Bangla",
    examTrack: "Primary & NTRCA",
    difficulty: "Medium",
    sourceYear: "DPE / NTRCA Archive",
    examSeries: "Primary & NTRCA Archive",
    tags: ["samas", "nctb", "primary"],
  },
  {
    question: "Deficiency of which vitamin causes Night Blindness (রাতকানা রোগ)?",
    options: ["Vitamin A", "Vitamin B1", "Vitamin C", "Vitamin D"],
    correctIndex: 0,
    explanation:
      "Vitamin A (Retinol) is essential for retinal vision pigment; its deficiency leads to Night Blindness.",
    subject: "General Science & ICT",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "DPE / NTRCA Archive",
    examSeries: "Primary & NTRCA Archive",
    tags: ["vitamins", "biology", "primary"],
  },
  {
    question: "Choose the correct preposition: 'We should abstain ___ smoking for good health.'",
    options: ["to", "of", "from", "with"],
    correctIndex: 2,
    explanation:
      "The verb 'abstain' (বিরত থাকা) is always followed by the appropriate preposition 'from'.",
    subject: "English",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "DPE / NTRCA Archive",
    examSeries: "Primary & NTRCA Archive",
    tags: ["prepositions", "primary", "ntrca"],
  },
  {
    question: "১৯৫২ সালের ২১শে ফেব্রুয়ারি বাংলা কত তারিখ ছিল?",
    options: ["৭ ফাল্গুন ১৩৫৮", "৮ ফাল্গুন ১৩৫৮", "৯ ফাল্গুন ১৩৫৯", "২১ মাঘ ১৩৫৮"],
    correctIndex: 1,
    explanation:
      "১৯৫২ সালের ২১শে ফেব্রুয়ারি বৃহস্পতিবার ছিল বাংলা ৮ ফাল্গুন ১৩৫৮ বঙ্গাব্দ।",
    subject: "Bangladesh Affairs",
    examTrack: "Primary & NTRCA",
    difficulty: "Medium",
    sourceYear: "DPE / NTRCA Archive",
    examSeries: "Primary & NTRCA Archive",
    tags: ["language-movement", "1952", "primary"],
  },
  {
    question: "১ থেকে ১০ পর্যন্ত মৌলিক (Prime) সংখ্যা কয়টি?",
    options: ["৩টি", "৪টি", "৫টি", "৬টি"],
    correctIndex: 1,
    explanation:
      "১ থেকে ১০ পর্যন্ত মৌলিক সংখ্যা ৪টি: ২, ৩, ৫ এবং ৭ (মনে রাখবেন ১ মৌলিক সংখ্যা নয়)।",
    subject: "Math & Mental Ability",
    examTrack: "Primary & NTRCA",
    difficulty: "Easy",
    sourceYear: "DPE / NTRCA Archive",
    examSeries: "Primary & NTRCA Archive",
    tags: ["prime-numbers", "arithmetic", "primary"],
  },

  {
    question: "বাংলা একাডেমির প্রমিত বাংলা বানান নিয়ম অনুযায়ী নিচের কোন বানানটি শুদ্ধ?",
    options: ["মুমুর্ষু", "মুমূর্ষু", "মূমুর্ষু", "মুমূর্ষূ"],
    correctIndex: 1,
    explanation:
      "সঠিক বানান হলো 'মুমূর্ষু' — প্রথম অক্ষরে উ-কার (ু), দ্বিতীয় অক্ষরে ঊ-কার (ূ), এবং তৃতীয় অক্ষরে উ-কার (ু)।",
    subject: "Bangla",
    examTrack: "Grade 11-20",
    difficulty: "Medium",
    sourceYear: "Ministry Archive",
    examSeries: "Ministry Grade 11-20 Archive",
    tags: ["spelling", "bangla-academy", "grade-11-20"],
  },
  {
    question: "Under Teletalk online recruitment for Grade 11–20 ministry posts, which SMS keyword pair confirms a paid application fee?",
    options: [
      "First SMS with User ID -> Second SMS with PIN after Yes confirmation",
      "Direct Bkash merchant payment without PIN",
      "Sending physical postal order to MOPA",
      "Emailing scanned admit card before fee",
    ],
    correctIndex: 0,
    explanation:
      "Teletalk uses two SMS steps: Step 1 sends '<PORTALCODE> <UserID>' to 16222 to receive a PIN, and Step 2 sends '<PORTALCODE> YES <PIN>' to deduct the fee and unlock Applicant Copy.",
    subject: "Govt Job Rules & Banking",
    examTrack: "Grade 11-20",
    difficulty: "Easy",
    sourceYear: "Ministry Archive",
    examSeries: "Ministry Grade 11-20 Archive",
    tags: ["teletalk", "application", "grade-11-20"],
  },
  {
    question: "In Microsoft Word / LibreOffice Writer (practical test for Computer Operator Grade 13), which shortcut creates a clean Hanging Indent or Page Break?",
    options: [
      "Ctrl + Enter inserts a Page Break",
      "Ctrl + B inserts a Page Break",
      "Alt + F4 inserts a Page Break",
      "Ctrl + Z saves the file",
    ],
    correctIndex: 0,
    explanation:
      "Ctrl + Enter inserts an immediate Page Break; Ctrl + B is Bold; Ctrl + Z is Undo.",
    subject: "General Science & ICT",
    examTrack: "Grade 11-20",
    difficulty: "Easy",
    sourceYear: "Ministry Archive",
    examSeries: "Ministry Grade 11-20 Archive",
    tags: ["ms-office", "computer-operator", "practical"],
  },
  {
    question: "Which of the following sentences is grammatically correct?",
    options: [
      "He discussed about the problem in detail.",
      "He entered into the room quietly.",
      "He resembles his father in every way.",
      "She ordered for a cup of coffee.",
    ],
    correctIndex: 2,
    explanation:
      "Transitive verbs like 'resemble', 'discuss', 'enter' (a physical room), and 'order' take NO preposition directly after them in active statements.",
    subject: "English",
    examTrack: "Grade 11-20",
    difficulty: "Medium",
    sourceYear: "Ministry Archive",
    examSeries: "Ministry Grade 11-20 Archive",
    tags: ["correction", "preposition-trap", "grade-11-20"],
  },
  {
    question: "বাংলাদেশ সংবিধানের কোন অনুচ্ছেদ অনুযায়ী প্রজাতন্ত্রের চাকরিতে নিয়োগ লাভের ক্ষেত্রে সকল নাগরিকের জন্য সুযোগের সমতা থাকবে?",
    options: ["অনুচ্ছেদ ২৭", "অনুচ্ছেদ ২৯", "অনুচ্ছেদ ৩২", "অনুচ্ছেদ ৩৯"],
    correctIndex: 1,
    explanation:
      "সংবিধানের ২৯ নম্বর অনুচ্ছেদে প্রজাতন্ত্রের কর্মে নিয়োগ ও পদলাভের ক্ষেত্রে সকল নাগরিকের সুযোগের সমতার মৌলিক অধিকার নিশ্চিত করা হয়েছে।",
    subject: "Bangladesh Affairs",
    examTrack: "Grade 11-20",
    difficulty: "Medium",
    sourceYear: "Ministry Archive",
    examSeries: "Ministry Grade 11-20 Archive",
    tags: ["constitution", "article-29", "grade-11-20"],
  },
  ...extraMcqQuestions,
  ...bcsPastArchiveMcqs,
  ...ministryPostOfficeMcqs,
  ...primaryNtrcaArchiveMcqs,
  ...bankAndRulesArchiveMcqs,
  ...deepCoverageArchiveMcqs,
];
