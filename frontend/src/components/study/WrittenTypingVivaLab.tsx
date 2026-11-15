"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Keyboard,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from "lucide-react";

type LabSubTab = "written" | "typing" | "viva";

interface WrittenPrompt {
  id: string;
  category:
    | "Post Office & Grade 11–20"
    | "Bangla Letter & Report"
    | "English Application & Precis"
    | "Translation (BN ↔ EN)"
    | "Bank Focus Writing & Math";
  examBadge: string;
  marksTarget: string;
  timeTarget: string;
  title: string;
  prompt: string;
  structureChecklist: string[];
  modelAnswer: string;
  examinerTips: string;
}

interface TypingPassage {
  id: string;
  label: string;
  language: "EN" | "BN";
  benchmarkWpm: number;
  minAccuracy: number;
  examContext: string;
  text: string;
}

interface VivaCard {
  id: string;
  postTrack:
    | "Bangladesh Post Office (Grade 11–20)"
    | "Ministry / Directorate (Grade 11–20)"
    | "Primary Teacher & NTRCA"
    | "Bank SO / Officer & BCS";
  question: string;
  languageHint: string;
  modelAnswer: string;
  boardTrap: string;
}

const WRITTEN_PROMPTS: WrittenPrompt[] = [
  {
    id: "w-post-report",
    category: "Post Office & Grade 11–20",
    examBadge: "Post Office & Ministry Grade 11–16 Written",
    marksTarget: "10–15 Marks",
    timeTarget: "12 Min",
    title: "প্রতিবেদন (Report): ডাকঘরের ডিজিটাল সেবা আধুনিকায়ন",
    prompt:
      "গ্রামীণ ও শহর পর্যায়ে বাংলাদেশ ডাক বিভাগের ডিজিটাল সেবা (EMTS, ডাক টাকা, ই-কমার্স পার্সেল ও ডাক জীবন বীমা) জনপ্রিয় করতে করণীয় সম্পর্কে ঊর্ধ্বতন কর্তৃপক্ষের নিকট একটি প্রতিবেদন রচনা করো।",
    structureChecklist: [
      "তারিখ + বরাবর + মাধ্যম (যথাযথ কর্তৃপক্ষ) + বিষয় + সূত্র স্পষ্ট লিখুন",
      "মাঝখানে মোটা হরফে প্রতিবেদনটির শিরোনাম (Headline) দিন",
      "মূল বক্তব্যে ৩টি অনুচ্ছেদ: ভূমিকা, মাঠপর্যায়ের ৩–৪টি সুপারিশ, উপসংহার",
      "নিচে বাম/ডানে প্রতিবেদকের নাম, পদবি, তারিখ ও 'সংযুক্তি' (যদি থাকে)",
    ],
    modelAnswer: `তারিখ: ১৫ নভেম্বর ২০২৬
বরাবর
মহাপরিচালক
ডাক অধিদপ্তর, আগারগাঁও, ঢাকা-১২০৭।

বিষয়: গ্রামীণ ও শহর পর্যায়ে ডাক বিভাগের ডিজিটাল সেবা আধুনিকায়ন ও সম্প্রসারণ সংক্রান্ত প্রতিবেদন।

মহোদয়,
আপনার সদয় নির্দেশনা অনুযায়ী (সূত্র নং- ১৪.৩১.০০০০.০২১/১৬৭) ডাক বিভাগের ডিজিটাল সেবা—ইলেকট্রনিক মানি ট্রান্সফার সার্ভিস (EMTS), ডাক টাকা, ই-কমার্স পার্সেল এবং ডাক জীবন বীমা (PLI) জনসাধারণের কাছে আরও সহজলভ্য করার লক্ষ্যে সরেজমিন পর্যবেক্ষণ ও সুপারিশমালা নিচে পেশ করা হলো:

১. বর্তমান অবস্থা: সারা দেশে প্রায় ৯,৮৮৬টি ডাকঘরের বিশাল নেটওয়ার্ক থাকা সত্ত্বেও পর্যাপ্ত ব্রডব্যান্ড সংযোগ, ডিজিটাল পোস্টারে প্রচারণা এবং আধুনিক স্ক্যানার/প্রিন্টারের অভাবে ই-কমার্স উদ্যোক্তা ও প্রবাসীদের পরিবার পূর্ণ সুবিধা পাচ্ছেন না।
২. আধুনিকায়নে প্রধান সুপারিশ:
   (ক) প্রতিটি উপজেলা ও সাব-পোস্ট অফিসে নিরবচ্ছিন্ন ইন্টারনেট ও POS ডিভাইস নিশ্চিত করা।
   (খ) ই-কমার্স পার্সেল ট্র্যাকিং অ্যাপ ও ২৪ ঘণ্টার ক্যাশ-অন-ডেলিভারি (COD) নিষ্পত্তি চালু রাখা।
   (গ) পোস্টাল অপারেটর ও পোস্টমাস্টারদের জন্য প্রতি ৩ মাসে ডিজিটাল সেবা ও গ্রাহকসেবা বিষয়ক রিফ্রেশার প্রশিক্ষণ আয়োজন।
   (ঘ) ডাক জীবন বীমা (PLI) প্রিমিয়াম জমা ও ডাক সঞ্চয় ব্যাংক স্টেটমেন্ট সম্পূর্ণ SMS/অনলাইন ভিত্তিক করা।

উপসংহার: উপর্যুক্ত পদক্ষেপসমূহ বাস্তবায়িত হলে ডাক বিভাগ দেশের নির্ভরযোগ্য স্মার্ট লজিস্টিকস ও ক্ষুদ্র আর্থিক সেবার প্রধান কেন্দ্রে পরিণত হবে।

প্রতিবেদকের বিবরণ:
মোঃ রাশেদুল ইসলাম
পোস্টাল অপারেটর (মাঠপর্যায় পরিদর্শন দল)
ঢাকা জিপিও, ঢাকা-১০০০।`,
    examinerTips:
      "নম্বর কাটা যায়: বিষয় সংক্ষিপ্ত না হলে, সূত্র/তারিখ বাদ পড়লে অথবা প্রতিবেদকের ঠিকানা না দিলে। সবসময় কাল্পনিক নাম/পদবি ব্যবহার করবেন; নিজের আসল রোল বা নাম লিখবেন না।",
  },
  {
    id: "w-bangla-application",
    category: "Bangla Letter & Report",
    examBadge: "All Grade 11–20 & Primary/NTRCA",
    marksTarget: "10 Marks",
    timeTarget: "10 Min",
    title: "দাপ্তরিক আবেদনপত্র: কম্পিউটার ল্যাব/নথি ডিজিটালাইজেশন ও ছুটির আবেদন",
    prompt:
      "আপনার দপ্তরের নথিপত্র ডিজিটাল আর্কাইভিং ও নাগরিক সেবা দ্রুততর করার লক্ষ্যে উচ্চগতির স্ক্যানার ও কম্পিউটার বরাদ্দ চেয়ে সচিব/মহাপরিচালক বরাবর একটি আবেদনপত্র লিখুন।",
    structureChecklist: [
      "দাপ্তরিক আবেদনে 'আবেদনকারীর ঠিকানা' বাম মার্জিন ঘেঁষে একই এলাইনমেন্টে লিখুন",
      "'মাধ্যম: যথাযথ কর্তৃপক্ষ' লিখলে সরকারি নিয়মে ৩ নম্বর বেশি সুরক্ষিত থাকে",
      "অবশ্যই সংযুক্তি (যেমন: চাহিদাপত্রের বিবরণী) উল্লেখ করবেন",
    ],
    modelAnswer: `তারিখ: ১৫ নভেম্বর ২০২৬
বরাবর
সচিব / মহাপরিচালক
[সংশ্লিষ্ট মন্ত্রণালয় / অধিদপ্তর], বাংলাদেশ সচিবালয়, ঢাকা-১০০০।
মাধ্যম: যথাযথ কর্তৃপক্ষ।

বিষয়: দাপ্তরিক নথি ডিজিটালাইজেশনের জন্য কম্পিউটার ও উচ্চগতির স্ক্যানার বরাদ্দের আবেদন।

জনাব,
সবিনয় নিবেদন এই যে, আমি নিম্নস্বাক্ষরকারী অত্র দপ্তরের রেকর্ড ও ই-নথি ব্যবস্থাপনা শাখায় কর্মরত আছি। প্রতিদিন বিপুল পরিমাণ দাপ্তরিক নথি, পেনশন ফাইল ও নাগরিক আবেদন ই-নথি সিস্টেমে আপলোড করতে হয়। বর্তমানে শাখায় থাকা পুরোনো ২টি কম্পিউটার ও ধীরগতির স্ক্যানার দিয়ে নির্ধারিত সময়ের মধ্যে নথিপত্র নিষ্পত্তি করা কষ্টসাধ্য হয়ে পড়েছে।

ই-গভর্ন্যান্স বাস্তবায়ন ও নাগরিক সেবা নির্বিঘ্ন করতে অত্র শাখায় অন্তত ০৩টি আধুনিক ডেস্কটপ কম্পিউটার ও ০২টি ডুপ্লেক্স উচ্চগতির স্ক্যানার জরুরি ভিত্তিতে বরাদ্দ দেওয়া একান্ত প্রয়োজন।

অতএব, দাপ্তরিক কাজের গতিশীলতা ও ডিজিটাল রেকর্ড সংরক্ষণের স্বার্থে উক্ত যন্ত্রপাতি বরাদ্দের সদয় আদেশ দানে মর্জি হয়।

বিনীত নিবেদক,
(স্বাক্ষর)
পদবি: অফিস সহকারী-কাম-কম্পিউটার মুদ্রাক্ষরিক
শাখা: প্রশাসন ও ই-নথি শাখা।
সংযুক্তি: প্রয়োজনীয় যন্ত্রপাতির সম্ভাব্য তালিকা (০১ পাতা)।`,
    examinerTips:
      "বামপাশের মার্জিন বরাবর সব লাইন শুরু করাই আধুনিক প্রমিত বাংলা দাপ্তরিক রীতি (আগের ডান-বাম মিশ্রিত ফরম্যাটের বদলে)।",
  },
  {
    id: "w-english-application",
    category: "English Application & Precis",
    examBadge: "PSC Non-Cadre, Ministry & Bank Written",
    marksTarget: "10–15 Marks",
    timeTarget: "12 Min",
    title: "Official English Application + 1/3rd Precis Formula",
    prompt:
      "Write an official letter to the Director General, Department of Posts, requesting 10 days' Earned Leave (Station Leave Permission) for urgent family medical treatment, including handover responsibility.",
    structureChecklist: [
      "Mention exact dates, reason, Station Leave request, and colleague handover name",
      "Use concise Secretariat tone: 'With due respect and humble submission...'",
      "For Precis questions: Strict 1/3rd word count + Title + Indirect Speech + No own examples",
    ],
    modelAnswer: `15 November 2026

To
The Director General
Directorate of Posts, Agargaon, Dhaka-1207.
(Through proper channel)

Subject: Prayer for 10 days' Earned Leave with Station Leave permission.

Sir,
With due respect and humble submission, I beg to state that I have been serving as a Postal Operator at Dhaka GPO since 2023. My mother needs urgent medical consultation and follow-up care in Chattogram, and there is no other family member available to accompany her.

Therefore, I kindly request you to grant me 10 (ten) days' Earned Leave with full pay from 20 November 2026 to 29 November 2026, along with permission to leave the Dhaka station. During my absence, my colleague Mr. Karim Uddin will temporarily look after my urgent desk duties with due care.

I shall remain ever grateful if you kindly approve my leave application.

Yours obediently,
Md. Shakil Ahmed
Postal Operator (Grade-16)
Dhaka GPO, Dhaka-1000.
Enclosure: Medical Prescription Copy (01 page).`,
    examinerTips:
      "English Written-এ 'I have the honor to state that' অথবা 'With due respect' ব্যবহার করুন; কমা/ক্যাপিটালাইজেশন ও বানান (separate, accommodation, privilege, committee) নির্ভুল রাখলে ১ নম্বরও কাটে না।",
  },
  {
    id: "w-translation-pack",
    category: "Translation (BN ↔ EN)",
    examBadge: "46th BCS, Bank SO, PSC & Ministry Written",
    marksTarget: "10–25 Marks",
    timeTarget: "15 Min",
    title: "High-Yield Secretariat, Economy & Constitution Translations",
    prompt:
      "Practice 5 frequent Bangla ↔ English exam translation sentences using natural idiomatic structures instead of clumsy word-for-word rendering.",
    structureChecklist: [
      "Identify Tense & Voice first — active Bangla sentences often convert cleanly to passive/impersonal English",
      "Use standard govt terms: গণপ্রজাতন্ত্রী বাংলাদেশ = People's Republic of Bangladesh, প্রজাতন্ত্রের কর্ম = Service of the Republic",
      "Avoid translating idioms literally (যেমন: 'ডুমুরের ফুল' ≠ fig flower -> 'rarely seen / invisible for long')",
    ],
    modelAnswer: `১. সংবিধান ও প্রশাসন (BN -> EN):
বাংলা: প্রজাতন্ত্রের সকল ক্ষমতার মালিক জনগণ এবং সংবিধানের প্রাধান্য অক্ষুণ্ণ রাখা সকল নাগরিকের পবিত্র দায়িত্ব।
English: All powers in the Republic belong to the people, and it is the sacred duty of every citizen to uphold the supremacy of the Constitution.

২. অর্থনীতি ও ব্যাংকিং (BN -> EN):
বাংলা: মুদ্রাস্ফীতি নিয়ন্ত্রণ ও প্রবাসী আয় বৃদ্ধির মাধ্যমে বৈদেশিক মুদ্রার রিজার্ভ স্থিতিশীল রাখা এখন সময়ের দাবি।
English: Stabilizing foreign exchange reserves by containing inflation and boosting remittance inflows is now the demand of the hour.

৩. ডাক ও ডিজিটাল সেবা (BN -> EN):
বাংলা: প্রান্তিক পর্যায়ের সাধারণ মানুষের কাছে সাশ্রয়ী ও নির্ভরযোগ্য সেবা পৌঁছে দিতে বাংলাদেশ ডাক বিভাগ নিরলস কাজ করছে।
English: Bangladesh Post Office is working relentlessly to deliver affordable and reliable services to grassroots citizens.

৪. English -> Bangla (BCS & Ministry Style):
English: Good governance cannot take root unless transparency, accountability, and the rule of law are ensured across every tier of public administration.
বাংলা: জনপ্রশাসনের প্রতিটি স্তরে স্বচ্ছতা, জবাবদিহিতা ও আইনের শাসন নিশ্চিত না হলে সুশাসন শিকড় গাড়তে পারে না।

৫. English -> Bangla (Environment & Disaster):
English: As a climate-vulnerable deltaic nation, Bangladesh must prioritize river dredging and nature-based coastal protection.
বাংলা: জলবায়ু ঝুঁকিপূর্ণ ব-দ্বীপ রাষ্ট্র হিসেবে বাংলাদেশকে নদী খনন ও প্রকৃতিনির্ভর উপকূলীয় সুরক্ষাকে অগ্রাধিকার দিতে হবে।`,
    examinerTips:
      "পরীক্ষায় অনুবাদ করার সময় কখনো ১টি শব্দের জন্য পুরো বাক্য থামিয়ে রাখবেন না; সমার্থক সহজ শব্দে মূল ভাব (Core Sense) অক্ষুণ্ণ রাখুন।",
  },
  {
    id: "w-bank-focus-math",
    category: "Bank Focus Writing & Math",
    examBadge: "Combined Bank SO / Officer & Ministry Descriptive",
    marksTarget: "20–35 Marks",
    timeTarget: "20 Min",
    title: "Bank Focus Writing + Descriptive Math Presentation Rules",
    prompt:
      "Master Focus Writing ('Cashless Bangladesh & Financial Inclusion') plus the 5 mandatory steps examiners check in Descriptive Math solutions.",
    structureChecklist: [
      "Focus Writing 4-Part Formula: Hook + Fact -> 3 Structured Drivers -> Challenges (Cyber/Literacy) -> Concrete Recommendations",
      "Descriptive Math-এ 'ধরি / মনে করি' দিয়ে চলক ঘোষণা এবং শেষে 'উত্তর: ...' এককসহ (টাকা / % / মিটার) অবশ্যই লিখবেন",
      "MCQ শর্টকাট ফর্মুলা সরাসরি লিখিত পরীক্ষায় লিখলে পূর্ণ নম্বর পাওয়া যায় না — ধাপ দেখাতে হবে",
    ],
    modelAnswer: `=== FOCUS WRITING BLUEPRINT: Cashless Bangladesh & Financial Inclusion ===
1. Introduction (4–5 lines): Define digital payment ecosystem (MFS, Bangla QR, NPSB, Agent Banking, e-KYC). Mention how last-mile inclusion turns informal savings into productive credit.
2. Core Drivers:
   • Interoperability: Bangla QR & Instant Payment linking banks, MFS (bKash/Nagad/Rocket), and Dak Taka.
   • Cost Efficiency: Lower cash-printing/handling cost & transparent G2P (Government-to-Person) allowance disbursement.
   • MSME Credit Scoring: Digital transaction trails help micro-merchants access formal SME loans without collateral.
3. Key Challenges: Digital literacy gap in rural regions, phishing/fraud risks, and merchant MDR fee reluctance.
4. Way Forward & Conclusion: Zero-fee micro-merchant QR incentives up to monthly thresholds, strong Bangladesh Bank cybersecurity audits, and school-level financial literacy.

=== DESCRIPTIVE MATH 5-STEP FULL-MARKS CHECKLIST (লিখিত গণিত) ===
উদাহরণ: কোনো আসল ৪ বছরে সরল মুনাফায় ৫,২০০ টাকা এবং ৬ বছরে ৫,৮০০ টাকা হয়। আসল ও মুনাফার হার কত?
ধাপ ১ (সমীকরণ গঠন): আসল + ৬ বছরের মুনাফা = ৫,৮০০ টাকা; আসল + ৪ বছরের মুনাফা = ৫,২০০ টাকা।
ধাপ ২ (বিয়োগ): ২ বছরের মুনাফা = (৫,৮০০ - ৫,২০০) = ৬০০ টাকা।
ধাপ ৩ (১ ও ৪ বছরের মুনাফা): ৪ বছরের মুনাফা = (৬০০ ÷ ২) × ৪ = ১,২০০ টাকা।
ধাপ ৪ (আসল নির্ণয়): আসল (P) = ৫,২০০ - ১,২০০ = ৪,০০০ টাকা।
ধাপ ৫ (হার নির্ণয় সূত্রসহ): আমরা জানি, I = Pnr => r = I / (Pn) = ১,২০০ / (৪,০০০ × ৪) = ০.০৭৫ = ৭.৫%।
উত্তর: আসল ৪,০০০ টাকা এবং বার্ষিক মুনাফার হার ৭.৫%।`,
    examinerTips:
      "লিখিত গণিতে ডানপাশে [বি.দ্র. বা রাফ] স্পষ্ট করে লিখলে এবং প্রতি লাইনে সমান চিহ্ন (=) ঠিক রাখলে ৫০/৫০ তোলা সম্ভব!",
  },
];

const TYPING_PASSAGES: TypingPassage[] = [
  {
    id: "type-en-ministry",
    label: "English • Secretariat & Computer Operator",
    language: "EN",
    benchmarkWpm: 25,
    minAccuracy: 94,
    examContext: "Ministry Grade 13–16 (20–30 WPM pass standard)",
    text: "Bangladesh Secretariat maintains transparent public administration through e-nothi, timely circular processing, and accountable desk management across every ministry and directorate.",
  },
  {
    id: "type-en-postal",
    label: "English • Bangladesh Post Office & UPU",
    language: "EN",
    benchmarkWpm: 20,
    minAccuracy: 93,
    examContext: "Postal Operator / Sorting Assistant Practical",
    text: "Bangladesh Post Office connects urban hubs and rural unions with express mail, parcel tracking, electronic money transfer, savings banking, and postal life insurance services.",
  },
  {
    id: "type-bn-office",
    label: "বাংলা • দাপ্তরিক মুদ্রাক্ষরিক (Unicode)",
    language: "BN",
    benchmarkWpm: 20,
    minAccuracy: 92,
    examContext: "অফিস সহকারী-কাম-কম্পিউটার মুদ্রাক্ষরিক (২০ WPM মানদণ্ড)",
    text: "বাংলাদেশ সরকারের প্রতিটি মন্ত্রণালয় ও অধিদপ্তরের দাপ্তরিক চিঠিপত্র নির্ভুল বানান, স্পষ্ট মার্জিন এবং দ্রুতগতির মাধ্যমে ই-নথি ব্যবস্থাপনায় নিষ্পত্তি করা অপরিহার্য।",
  },
  {
    id: "type-bn-constitution",
    label: "বাংলা • সংবিধান ও ডাক সেবা অনুশীলন",
    language: "BN",
    benchmarkWpm: 20,
    minAccuracy: 92,
    examContext: "সাধারণ বাংলা দ্রুত টাইপিং অনুশীলন (Unicode / Avro)",
    text: "গণপ্রজাতন্ত্রী বাংলাদেশের সংবিধান দেশের সর্বোচ্চ আইন এবং ডাক বিভাগ দেশের প্রান্তিক মানুষের আস্থার প্রতীক হিসেবে নিরবচ্ছিন্ন জনসেবা প্রদান করে যাচ্ছে।",
  },
];

const VIVA_CARDS: VivaCard[] = [
  {
    id: "viva-intro-why",
    postTrack: "Bangladesh Post Office (Grade 11–20)",
    question:
      "আপনি স্নাতক/স্নাতকোত্তর পাস করে কেন ডাক বিভাগের গ্রেড ১১–২০ বা ৩য় শ্রেণির পদে চাকরি করতে চান?",
    languageHint: "মার্জিত বাংলায় আত্মবিশ্বাসের সাথে",
    modelAnswer:
      "স্যার, আমার লক্ষ্য হলো কর্মজীবনের শুরু থেকেই একটি স্থায়ী ও সম্মানজনক রাষ্ট্রীয় প্রতিষ্ঠানে জনসেবার সুযোগ পাওয়া। বাংলাদেশ ডাক বিভাগ দেশের অন্যতম প্রাচীন ও বিশ্বস্ত সেবামূলক প্রতিষ্ঠান। মাঠপর্যায়ে কাজ করে প্রশাসনিক অভিজ্ঞতা অর্জনের পাশাপাশি সততা ও ডিজিটাল দক্ষতা কাজে লাগিয়ে ডাক সেবাকে এগিয়ে নিতে চাই। ভবিষ্যতে বিভাগীয় পরীক্ষার মাধ্যমে পদোন্নতির সুযোগও এখানে রয়েছে।",
    boardTrap:
      "ভুলেও বলবেন না: 'অন্য কোনো চাকরি পাচ্ছি না তাই এটাতে এসেছি' অথবা 'বিসিএসের প্রস্তুতি নেওয়ার জন্য সময় পাওয়া যাবে' — এতে বোর্ড অসন্তুষ্ট হয়।",
  },
  {
    id: "viva-postal-facts",
    postTrack: "Bangladesh Post Office (Grade 11–20)",
    question:
      "বাংলাদেশ ডাক বিভাগ সম্পর্কে বলুন: কত সালে প্রতিষ্ঠিত, UPU কী, PLI ও EMTS কী?",
    languageHint: "তথ্যনির্ভর সংক্ষিপ্ত উত্তর",
    modelAnswer:
      "বাংলাদেশ ডাক বিভাগ ২০ ডিসেম্বর ১৯৭১ সালে আনুষ্ঠানিক যাত্রা শুরু করে এবং ১৯৭৩ সালের ৭ ফেব্রুয়ারি Universal Postal Union (UPU)-এর সদস্যপদ লাভ করে। এটি ডাক ও টেলিযোগাযোগ বিভাগের অধীনস্ত। প্রধান সেবাসমূহ: PLI (Postal Life Insurance / ডাক জীবন বীমা — ১৮৮৪ সালে শুরু হওয়া দেশের প্রাচীনতম বীমা), EMTS (Electronic Money Transfer Service), RMS (Railway Mail Service) এবং ডাক টাকা / ডাকঘর সঞ্চয় ব্যাংক। সারাদেশে প্রায় ৯,৮৮৬টি ডাকঘর ও ১,৩০০+ পোস্ট কোড রয়েছে (যেমন ঢাকা জিপিও-১০০০)।",
    boardTrap:
      "নিজের নিজ জেলা ও থানার পোস্ট কোড না জেনে ডাকঘরের ভাইভায় কখনোই যাবেন না!",
  },
  {
    id: "viva-ministry-rules",
    postTrack: "Ministry / Directorate (Grade 11–20)",
    question:
      "নথি (File), নোট শিট ও ডাক রেজিস্টার বলতে কী বোঝায়? সচিবালয় নির্দেশমালা অনুযায়ী সরকারি কর্মচারীর মূল আচরণবিধি কী?",
    languageHint: "দাপ্তরিক জ্ঞান যাচাই",
    modelAnswer:
      "কোনো নির্দিষ্ট বিষয়ে প্রাপ্ত পত্র (ডাক) ও তার ওপর ঊর্ধ্বতন কর্মকর্তাদের নির্দেশনাসহ সুশৃঙ্খল কাগজপত্রের সমষ্টিকে নথি (File) বলে। নথির বাম পাশে নোট শিট (Note Sheet) এবং ডান পাশে পত্রাংশ (Correspondence) থাকে। সরকারি কর্মচারী (আচরণ) বিধিমালা ১৯৭৯ অনুযায়ী প্রত্যেক কর্মচারীকে রাষ্ট্রীয় গোপনীয়তা রক্ষা, সময়নিষ্ঠা, নিরপেক্ষতা ও ঊর্ধ্বতন কর্তৃপক্ষের বৈধ আদেশ পালন করতে হবে।",
    boardTrap:
      "ফাইলের 'বাম পাশে কী থাকে, ডান পাশে কী থাকে' (বামে নোট শিট, ডানে পত্রাংশ) এবং নিজের পছন্দের পদের গ্রেড ও বেতন স্কেল মুখস্থ রাখবেন।",
  },
  {
    id: "viva-primary-demo",
    postTrack: "Primary Teacher & NTRCA",
    question:
      "প্রাথমিক বিদ্যালয়ের একজন শিশু ক্লাসে পড়ায় মনোযোগ দিচ্ছে না বা কাঁদছে — আপনি কীভাবে শ্রেণিকক্ষ সামলাবেন?",
    languageHint: "শিক্ষাদান পদ্ধতি ও মানবিকতা",
    modelAnswer:
      "স্যার, প্রথমেই আমি শাস্তি বা বকাঝকা না করে শিশুটির পাশে বসে স্নেহের সাথে কথা বলব এবং তার অস্বস্তির কারণ বুঝার চেষ্টা করব। এরপর খেলার ছলে, ছবি, ছড়া বা দলগত কাজের (Joyful Learning & Activity-based method) মাধ্যমে তাকে শ্রেণিকক্ষের পাঠদানে যুক্ত করব, যাতে সে বিদ্যালয়কে ভয়ের জায়গা নয় বরং আনন্দের জায়গা মনে করে।",
    boardTrap:
      "কখনো 'শাসন বা মারধর/দাঁড় করিয়ে রাখা' শব্দ বলবেন না; জাতীয় শিক্ষানীতি ও আইন অনুযায়ী শারীরিক ও মানসিক শাস্তি সম্পূর্ণ নিষিদ্ধ।",
  },
  {
    id: "viva-bank-bcs",
    postTrack: "Bank SO / Officer & BCS",
    question:
      "Introduce yourself briefly in English, and explain how Repo Rate helps control inflation without hurting rural SME growth.",
    languageHint: "Confident English + Balanced Economics",
    modelAnswer:
      "Good morning, respected members of the board. I am [Name] from [District], having completed my graduation in [Subject] with strong analytical and communication skills. Regarding monetary policy: when Bangladesh Bank raises the Repo Rate (policy rate), interbank borrowing becomes costlier, which moderates excess liquidity and dampens demand-pull inflation. However, to protect productive rural SMEs and agriculture from high borrowing costs, the central bank uses targeted refinance schemes and sector-specific interest caps.",
    boardTrap:
      "Keep self-introduction strictly within 45–60 seconds unless asked follow-ups; also revise your Honours thesis/major subject basics thoroughly.",
  },
];

const VIVA_DOCS = [
  "১. রঙিন প্রবেশপত্র (Admit Card) — ২ কপি (মূল ও সত্যায়িত)",
  "২. জাতীয় পরিচয়পত্র (NID) ও সদ্য তোলা ৪ কপি পাসপোর্ট সাইজ সত্যায়িত ছবি",
  "৩. সকল শিক্ষাগত যোগ্যতার মূল সনদ ও নম্বরপত্র (SSC, HSC, স্নাতক/স্নাতকোত্তর)",
  "৪. ১ম শ্রেণির গেজেটেড কর্মকর্তা প্রদত্ত চারিত্রিক সনদপত্র ও নাগরিকত্ব সনদ",
  "৫. প্রযোজ্য ক্ষেত্রে মুক্তিযোদ্ধা/প্রতিবন্ধী/ক্ষুদ্র নৃ-গোষ্ঠী/অভিজ্ঞতা ও বিভাগীয় অনাপত্তি (NOC) সনদ",
  "৬. কম্পিউটার অপারেটর/মুদ্রাক্ষরিক পদের জন্য সরকার অনুমোদিত প্রশিক্ষণ সনদ (যদি বিজ্ঞপ্তিতে চায়)",
];

function computeTypingStats(target: string, typed: string, elapsedSeconds: number) {
  let correctChars = 0;
  const maxCheck = Math.min(target.length, typed.length);
  for (let i = 0; i < maxCheck; i++) {
    if (typed[i] === target[i]) correctChars++;
  }
  const accuracy =
    typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100;
  const effectiveMinutes = Math.max(elapsedSeconds, 1) / 60;
  const grossWpm = Math.round(typed.length / 5 / effectiveMinutes);
  const netWpm = Math.round(correctChars / 5 / effectiveMinutes);
  const progressPercent =
    target.length > 0
      ? Math.min(100, Math.round((typed.length / target.length) * 100))
      : 0;
  return { correctChars, accuracy, grossWpm, netWpm, progressPercent };
}

export function WrittenTypingVivaLab() {
  const [subTab, setSubTab] = useState<LabSubTab>("written");
  const [writtenFilter, setWrittenFilter] = useState<string>("All");
  const [openWrittenIds, setOpenWrittenIds] = useState<Record<string, boolean>>({
    "w-post-report": true,
  });
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  // Typing lab state
  const [passageId, setPassageId] = useState<string>(TYPING_PASSAGES[0].id);
  const [durationSec, setDurationSec] = useState<number>(60);
  const [typedText, setTypedText] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const typingInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Viva lab state
  const [vivaFilter, setVivaFilter] = useState<string>("All");
  const [openVivaIds, setOpenVivaIds] = useState<Record<string, boolean>>({
    "viva-intro-why": true,
  });

  const activePassage = useMemo(
    () => TYPING_PASSAGES.find((p) => p.id === passageId) ?? TYPING_PASSAGES[0],
    [passageId]
  );

  // Run countdown timer cleanly inside an interval subscription
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= durationSec) {
          window.clearInterval(id);
          setIsRunning(false);
          setIsFinished(true);
          return durationSec;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning, durationSec]);

  const typingStats = useMemo(
    () => computeTypingStats(activePassage.text, typedText, elapsedSeconds),
    [activePassage.text, typedText, elapsedSeconds]
  );

  function resetTypingTest(nextPassageId?: string, nextDuration?: number) {
    if (nextPassageId) setPassageId(nextPassageId);
    if (typeof nextDuration === "number") setDurationSec(nextDuration);
    setTypedText("");
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsFinished(false);
  }

  function handleTypingChange(value: string) {
    if (isFinished) return;
    if (!isRunning && value.length > 0) {
      setIsRunning(true);
    }
    setTypedText(value);
    if (value.length >= activePassage.text.length && value.length > 0) {
      setIsRunning(false);
      setIsFinished(true);
    }
  }

  const filteredPrompts = useMemo(() => {
    if (writtenFilter === "All") return WRITTEN_PROMPTS;
    return WRITTEN_PROMPTS.filter((p) => p.category === writtenFilter);
  }, [writtenFilter]);

  const filteredVivas = useMemo(() => {
    if (vivaFilter === "All") return VIVA_CARDS;
    return VIVA_CARDS.filter((v) => v.postTrack === vivaFilter);
  }, [vivaFilter]);

  const remainingSec = Math.max(0, durationSec - elapsedSeconds);
  const passedTypingBenchmark =
    isFinished &&
    typingStats.netWpm >= activePassage.benchmarkWpm &&
    typingStats.accuracy >= activePassage.minAccuracy;

  return (
    <div className="space-y-6">
      {/* Studio Header & Mode Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-900">
              <Award className="h-3.5 w-3.5" />
              Stage 2 &amp; Stage 3 Complete Selection Lab
            </span>
            <h2 className="mt-2 text-lg sm:text-xl font-extrabold text-slate-900">
              Written Exam Formats, Live Typing Speed Test &amp; Viva Voce Board Prep
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl">
              MCQ পাস করার পর চূড়ান্ত চাকরি নিশ্চিত করতে লিখিত পরীক্ষা (প্রতিবেদন, পত্র,
              Translation, Focus Writing), কম্পিউটার টাইপিং (২০–৩০ WPM), এবং মৌখিক ভাইভা
              বোর্ডের প্রস্তুতি এখান থেকেই সম্পন্ন করুন।
            </p>
          </div>
          <Link
            href="/practice?mode=archive&examTrack=Grade%2011-20"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Practice Past MCQ Bank &rarr;</span>
          </Link>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            {
              id: "written" as LabSubTab,
              label: "Written Formats & Prompts",
              sub: "প্রতিবেদন, আবেদন, Translation & Math",
              icon: FileText,
            },
            {
              id: "typing" as LabSubTab,
              label: "Typing Speed Test (EN / বাংলা)",
              sub: "20–30 WPM Ministry Practical Check",
              icon: Keyboard,
            },
            {
              id: "viva" as LabSubTab,
              label: "Post-Wise Viva Board Q&A",
              sub: "Post Office, Ministry, Primary & Bank",
              icon: MessageSquare,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`rounded-xl border p-3.5 text-left transition-all duration-200 ease-in-out cursor-pointer ${
                  active
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                <p
                  className={`mt-1 text-[11px] ${
                    active ? "text-emerald-100" : "text-slate-500"
                  }`}
                >
                  {tab.sub}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB 1: WRITTEN TEMPLATES & SOLVED PROMPTS */}
      {subTab === "written" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
            {[
              "All",
              "Post Office & Grade 11–20",
              "Bangla Letter & Report",
              "English Application & Precis",
              "Translation (BN ↔ EN)",
              "Bank Focus Writing & Math",
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setWrittenFilter(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                  writtenFilter === cat
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredPrompts.map((item) => {
              const isOpen = !!openWrittenIds[item.id];
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-900">
                        {item.examBadge}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
                        {item.marksTarget} &bull; {item.timeTarget}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenWrittenIds((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer transition-colors"
                    >
                      <span>{isOpen ? "Hide Model Solution" : "Show Model Solution"}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <strong>প্রশ্ন / Prompt:</strong> {item.prompt}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.structureChecklist.map((chk) => (
                      <span
                        key={chk}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-900"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-700" />
                        <span>{chk}</span>
                      </span>
                    ))}
                  </div>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-2 space-y-3 border-t border-slate-100">
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1.5">
                            Model Full-Marks Format &amp; Answer
                          </p>
                          <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-slate-800 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                            {item.modelAnswer}
                          </pre>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                          <strong>Examiner Warning:</strong> {item.examinerTips}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-600">
                            Your Own Practice Draft Scratchpad (Optional):
                          </label>
                          <textarea
                            rows={3}
                            value={draftNotes[item.id] ?? ""}
                            onChange={(e) =>
                              setDraftNotes((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Write your own outline or intro/closing practice lines here..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: LIVE TYPING SPEED TEST (EN + BANGLA) */}
      {subTab === "typing" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Ministry &amp; Post Office Practical Typing Speed Simulator
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {activePassage.examContext} &bull; Pass Target:{" "}
                <strong className="text-emerald-800">
                  {activePassage.benchmarkWpm} Net WPM
                </strong>{" "}
                &amp;{" "}
                <strong className="text-emerald-800">
                  {activePassage.minAccuracy}%+ Accuracy
                </strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[60, 120, 180].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => resetTypingTest(undefined, sec)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                    durationSec === sec
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {sec / 60}m
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  resetTypingTest();
                  typingInputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TYPING_PASSAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => resetTypingTest(p.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                  passageId === p.id
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Live Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase text-slate-500">
                Time Left
              </p>
              <p className="mt-1 text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-700" />
                <span>{remainingSec}s</span>
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[11px] font-bold uppercase text-emerald-800">
                Net Speed
              </p>
              <p className="mt-1 text-xl font-extrabold text-emerald-950">
                {typingStats.netWpm}{" "}
                <span className="text-xs font-bold">WPM</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase text-slate-500">
                Accuracy
              </p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {typingStats.accuracy}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase text-slate-500">
                Completion
              </p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {typingStats.progressPercent}%
              </p>
            </div>
          </div>

          {/* Character Diff Preview */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:text-base leading-relaxed font-medium select-none">
            {Array.from(activePassage.text).map((ch, idx) => {
              let cls = "text-slate-500";
              if (idx < typedText.length) {
                cls =
                  typedText[idx] === ch
                    ? "text-emerald-700 bg-emerald-100/70"
                    : "text-rose-700 bg-rose-100 underline";
              } else if (idx === typedText.length) {
                cls = "text-slate-900 bg-amber-200/80 underline";
              }
              return (
                <span key={idx} className={cls}>
                  {ch}
                </span>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Start typing the passage above (timer begins automatically on first keystroke):
            </label>
            <textarea
              ref={typingInputRef}
              rows={3}
              value={typedText}
              disabled={isFinished}
              onChange={(e) => handleTypingChange(e.target.value)}
              placeholder={
                activePassage.language === "BN"
                  ? "এখানে অভ্র বা বিজয় Unicode দিয়ে উপরের বাংলা অনুচ্ছেদটি টাইপ শুরু করুন..."
                  : "Type the exact English passage above to measure Net WPM..."
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:text-base text-slate-900 focus:border-emerald-600 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          {isFinished && (
            <div
              className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
                passedTypingBenchmark
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : "border-amber-300 bg-amber-50 text-amber-950"
              }`}
            >
              <div>
                <p className="text-sm font-extrabold">
                  {passedTypingBenchmark
                    ? `PASSED! ${typingStats.netWpm} Net WPM (${typingStats.accuracy}% Accuracy) meets ${activePassage.benchmarkWpm} WPM Govt Standard`
                    : `Keep Practicing: ${typingStats.netWpm} Net WPM (${typingStats.accuracy}% Accuracy) — Target is ${activePassage.benchmarkWpm} WPM & ${activePassage.minAccuracy}%+`}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  Gross WPM: {typingStats.grossWpm} &bull; Exam Day Reminder: Keep Backspace
                  minimal, check MS Word margin (1 inch) &amp; MS Excel SUM/IF/VLOOKUP basics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetTypingTest();
                  typingInputRef.current?.focus();
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Practical Computer Test Quick Guide */}
          <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-slate-100 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
              <p className="font-extrabold text-slate-900">1. Bijoy vs Unicode</p>
              <p className="text-slate-600">
                বেশিরভাগ মন্ত্রণালয়/BCC প্র্যাকটিক্যালে <strong>Bijoy (SutonnyMJ, 14pt)</strong>{" "}
                অথবা <strong>Unicode (Nikosh)</strong> থাকে। অ্যাডমিট কার্ড অনুযায়ী উভয়টি অনুশীলন করুন।
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
              <p className="font-extrabold text-slate-900">2. MS Word &amp; PowerPoint</p>
              <p className="text-slate-600">
                Table তৈরি, Header/Footer, Page Margin (1&quot;), Justify (Ctrl+J), ও
                দাপ্তরিক স্মারকলিপি ৩–৫ মিনিটে সাজানো থাকতে হয়।
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
              <p className="font-extrabold text-slate-900">3. MS Excel Formulas</p>
              <p className="text-slate-600">
                বেতন শীট / গ্রেড ক্যালকুলেশন: <code>=SUM()</code>,{" "}
                <code>=AVERAGE()</code>, <code>=IF()</code>, <code>=COUNTIF()</code> এবং
                শতাংশ নির্ণয় প্রায়ই দেয়।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: VIVA VOCE BOARD PREP */}
      {subTab === "viva" && (
        <div className="space-y-5">
          {/* Mandatory Document Folder */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
              Viva Board Original Document Folder Checklist (ভাইভা বোর্ডে যা অবশ্যই নেবেন)
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {VIVA_DOCS.map((doc) => (
                <div
                  key={doc}
                  className="flex items-start gap-2 text-xs text-emerald-950 font-medium"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-700" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Post Filter */}
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
            {[
              "All",
              "Bangladesh Post Office (Grade 11–20)",
              "Ministry / Directorate (Grade 11–20)",
              "Primary Teacher & NTRCA",
              "Bank SO / Officer & BCS",
            ].map((track) => (
              <button
                key={track}
                type="button"
                onClick={() => setVivaFilter(track)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                  vivaFilter === track
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {track}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredVivas.map((v) => {
              const isOpen = !!openVivaIds[v.id];
              return (
                <article
                  key={v.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenVivaIds((prev) => ({ ...prev, [v.id]: !prev[v.id] }))
                    }
                    className="w-full flex items-start justify-between gap-3 text-left cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-900">
                          {v.postTrack}
                        </span>
                        <span className="text-slate-500">{v.languageHint}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {v.question}
                      </h4>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-500 mt-1 transition-transform duration-300 ease-in-out ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                          <strong className="text-emerald-900">Model Viva Answer: </strong>
                          {v.modelAnswer}
                        </div>
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                          <strong>Board Trap / সতর্কতা:</strong> {v.boardTrap}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
