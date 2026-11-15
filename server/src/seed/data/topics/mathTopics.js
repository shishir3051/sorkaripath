export const mathTopics = [
  {
    title: "Arithmetic Shortcuts: HCF-LCM, Percentage, Profit-Loss, Interest & Work-Time",
    slug: "math-arithmetic-shortcuts",
    subject: "Math & Mental Ability",
    unit: "Arithmetic Core (BCS + Bank)",
    targetTracks: ["BCS", "Bank & Financial", "Primary & NTRCA", "Grade 11-20"],
    estimatedMinutes: 40,
    highYieldSummary:
      "HCF-LCM, Percentage, Ratio-Mixture, Profit-Loss-Discount, Simple & Compound Interest, Work-Pipe-Cistern, and Boat-Train problems decide more than 60% of Mathematics marks in BCS, Bangladesh Bank, Primary, and Ministry written/MCQ exams. Master every underlying concept plus 10-second mental shortcuts.",
    keyFacts: [
      "HCF & LCM Core Rules: For ANY two integers a and b, LCM(a, b) × HCF(a, b) = a × b. For Fractions (after reducing to simplest form): HCF = (HCF of numerators) / (LCM of denominators) and LCM = (LCM of numerators) / (HCF of denominators).",
      "Successive Percentage Change & Discounts: Net % change = a + b + (ab / 100). Price +x% then -x% ALWAYS gives a net loss of (x² / 100)%. Two successive discounts d₁% and d₂% equal a single discount of [d₁ + d₂ - (d₁d₂ / 100)]%.",
      "Consumption Constant Formula: If commodity price rises by R%, reduce consumption by [R / (100 + R)] × 100% to keep expenditure unchanged.",
      "Profit & Loss Base Rule: Profit% and Loss% are ALWAYS calculated on Cost Price (CP) unless explicitly stated otherwise. Selling two articles at the SAME selling price where one gives x% profit & the other gives x% loss => Overall ALWAYS Loss = (x² / 100)% (if CP is same, net = 0%).",
      "Work-Time / Pipe Combined Formula: If A takes x days and B takes y days, together they finish in (xy) / (x + y) days. Man-Day work rule: (M₁ × D₁ × H₁) / W₁ = (M₂ × D₂ × H₂) / W₂.",
      "Simple Interest (I = Pnr) & Compound Interest (C = P(1 + r)^n): Difference between CI and SI for 2 years at rate R% is P × (R / 100)².",
    ],
    memoryTricks: [
      "Benchmark Fractions to Memorize: 1/2 = 50%, 1/3 = 33.33%, 1/4 = 25%, 1/5 = 20%, 1/6 = 16.67%, 1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%, 1/12 = 8.33%.",
      "Fraction HCF/LCM Trap: Whichever is asked (HCF or LCM) goes in the NUMERATOR, and the opposite goes in the DENOMINATOR — ALWAYS simplify fractions first! Also, LCM × HCF = a × b works ONLY for two numbers, not three.",
      "Average Speed for equal distances at speed x and y is NOT (x+y)/2 — it is Harmonic Mean: 2xy / (x + y).",
      "Boat & Stream: Downstream Speed D = b + s; Upstream Speed U = b - s; Speed of boat b = (D + U)/2, stream s = (D - U)/2.",
    ],
    quickExamples: [
      { label: "HCF=12, LCM=144, one num=36", detail: "Other number = (12 × 144) / 36 = 48" },
      { label: "Successive discounts 20% & 10%", detail: "Single discount = 20 + 10 - (20×10)/100 = 28% (NOT 30%!)" },
      { label: "Price +25%, keep budget same", detail: "Reduce use by [25 / (100+25)] × 100 = 20%" },
      { label: "SI vs CI gap in 2 yrs (P=10,000, R=10%)", detail: "10000 × (10/100)² = ৳100 immediately!" },
      { label: "A in 10d, B in 15d together", detail: "(10 × 15) / (10 + 15) = 150 / 25 = 6 days" },
    ],
    chapters: [
      {
        heading: "Chapter 1: HCF & LCM Shortcuts (Integers, Fractions & Remainders)",
        explanation:
          "HCF (গ.সা.গু.) and LCM (ল.সা.গু.) questions appear regularly in BCS, Primary, and Grade 11–20 exams via product relations, fraction rules, and remainder traps.",
        points: [
          "1. Product Law (Two Numbers Only): LCM(a, b) × HCF(a, b) = a × b. Note: If HCF of two numbers is H, the numbers can be written as Hx and Hy where x, y are co-prime, and LCM = Hxy.",
          "2. Fraction HCF & LCM: First reduce every fraction to its lowest form! Then: HCF of fractions = HCF(numerators) / LCM(denominators); LCM of fractions = LCM(numerators) / HCF(denominators).",
          "3. Co-prime Numbers (সহমৌলিক): Two numbers whose HCF = 1 (e.g., 8 and 15); their LCM is simply their product (8 × 15 = 120).",
          "4. Remainder Traps: Greatest number dividing a, b, c leaving remainders r₁, r₂, r₃ = HCF(a - r₁, b - r₂, c - r₃). Least number divisible by a, b, c leaving the SAME remainder r = LCM(a, b, c) + r.",
        ],
        workedExamples: [
          "Example 1 (Product Law): Two numbers are in ratio 3:4 and their HCF is 12. Find their LCM. Step: Numbers = 3×12 = 36 and 4×12 = 48. LCM = (36 × 48) / 12 = 144 (Check: 12 × 144 = 1728 = 36 × 48).",
          "Example 2 (Fraction HCF/LCM): Find HCF and LCM of 2/3, 4/9, and 8/15. Step: Already reduced. HCF = HCF(2,4,8) / LCM(3,9,15) = 2/45. LCM = LCM(2,4,8) / HCF(3,9,15) = 8/3 = 2 2/3.",
          "Example 3 (Remainder): Find the smallest number which when divided by 12, 15, and 20 leaves remainder 5 in each case. Step: LCM(12, 15, 20) + 5 = 60 + 5 = 65.",
        ],
      },
      {
        heading: "Chapter 2: Percentage, Ratio, Proportion & Mixture Alligation",
        explanation:
          "Percentages represent fractions out of 100. Switching seamlessly between fraction multipliers, successive formulas, and alligation ratios lets you solve Bank & BCS word problems in seconds.",
        points: [
          "1. Base Shift Law (পণ্যমূল্য ও খরচ): If A is R% MORE than B, B is [R / (100 + R)] × 100% LESS than A. Conversely, if A is R% LESS than B, B is [R / (100 - R)] × 100% MORE than A.",
          "2. Successive Change (ক্রমিক পরিবর্তন): Two consecutive % changes a% and b% combine into Net % = a + b + (ab/100). Works for rectangle area (length×breadth), consecutive price shifts, or two successive discounts d₁% and d₂% -> Net change = -d₁ - d₂ + d₁d₂/100, i.e. Equivalent Single Discount = d₁ + d₂ - (d₁d₂/100)%.",
          "3. Population Compounding: Present P growing at R% annually -> After n years: P(1 + R/100)^n; n years ago: P / (1 + R/100)^n. For depreciation at R%, use (1 - R/100)^n.",
          "4. Compound Ratio (ধারাবাহিক অনুপাত A:B:C): Given A:B = p:q and B:C = r:s, cross-multiply 'N'-pattern -> A:B:C = (p×r) : (q×r) : (q×s).",
          "5. Mixture & Rule of Alligation: (a) To adjust a Milk:Water mix, compute the UNCHANGED component's exact quantity first and match it to the new ratio. (b) Alligation: Mixing Cheaper (C) and Dearer (D) items to get Mean cost (M) -> Quantity Ratio (Cheaper : Dearer) = (D - M) : (M - C).",
        ],
        workedExamples: [
          "Example 1 (Base Shift): Onion price falls by 20%. How much % consumption can increase without changing budget? Step: [20 / (100 - 20)] × 100 = 20/80 × 100 = 25%.",
          "Example 2 (Successive Discount & Area): A shirt marked ৳500 gets 20% then 10% discount. Equivalent discount = 20 + 10 - (20×10)/100 = 28% -> SP = 500 × 0.72 = ৳360. Similarly, length +20% and width -10% changes area by +20 - 10 + (20×-10)/100 = +8%.",
          "Example 3 (Compound Ratio & Population): If A:B = 2:3 and B:C = 4:5, A:B:C = (2×4):(3×4):(3×5) = 8:12:15. If town population 10,000 grows 10% yearly, after 2 yrs = 10,000 × (1.1)² = 12,100.",
          "Example 4 (Mixture & Alligation): (a) In 60L milk-water (2:1), Milk = 40L, Water = 20L; to make 1:2, Water must be 80L -> add 60L water. (b) Mix ৳40/kg rice with ৳70/kg rice for ৳50/kg mean: Ratio = (70-50) : (50-40) = 20:10 = 2:1 (Check: (2×40 + 1×70)/3 = ৳50).",
        ],
      },
      {
        heading: "Chapter 3: Profit-Loss, Marked Price Discount & False Weights",
        explanation:
          "Always identify Cost Price (CP = 100% baseline), Selling Price (SP), and Marked Price (MP) cleanly before plugging numbers into profit/loss ratios.",
        points: [
          "1. Profit % = [(SP - CP) / CP] × 100; Loss % = [(CP - SP) / CP] × 100. Reverse formula: CP = SP × 100 / (100 ± Profit/Loss%).",
          "2. Same SP vs Same CP Trap: Two items sold at the SAME SP, one at x% gain & one at x% loss => ALWAYS Net Loss = (x²/100)%. (If CP is the same, net gain/loss = 0%!).",
          "3. 'Cost of x articles = Selling Price of y articles' Trap: Gain/Loss % = [(x - y) / y] × 100 (Positive -> Gain, Negative -> Loss).",
          "4. Dishonest Shopkeeper (False Weight): Selling at CP while weighing 'w' grams instead of '1000' grams -> Actual Profit % = [(1000 - w) / w] × 100 (Using 800g for 1kg = (200/800)×100 = 25% profit, NOT 20%!).",
          "5. Marked Price vs Discount Relationship: CP / MP = (100 - Discount%) / (100 + Profit%). This 1-line equation cracks ALL Bangladesh Bank Marked-Price questions!",
        ],
        workedExamples: [
          "Example 1: Selling an item at ৳480 causes a 20% loss. To gain 20%, what must SP be? Shortcut: 80% = 480 => CP = ৳600 => 120% = (480/80) × 120 = ৳720.",
          "Example 2 (Same SP & Article Trap): (a) Two phones sold at ৳12,000 each, one at 20% gain and one at 20% loss -> Net Loss = 20²/100 = 4% (CP₁=10,000, CP₂=15,000 => Total CP=25,000, SP=24,000). (b) If CP of 15 pens equals SP of 12 pens -> Profit = [(15-12)/12]×100 = 25%.",
          "Example 3 (Marked Price): A trader marks an item costing ৳400 so that after giving 20% discount he still earns 20% profit. Find MP. Step: 400 / MP = (100 - 20)/(100 + 20) = 80/120 = 2/3 => MP = ৳600 (Check: 80% of 600 = 480 SP -> 20% gain on 400).",
        ],
      },
      {
        heading: "Chapter 4: Simple Interest (SI), Compound Interest (CI) & Doubling",
        explanation:
          "Interest problems appear in both Primary/Grade 11-20 arithmetic and Combined Bank tests. Distinguish between Simple Interest (flat on initial principal P) and Compound Interest (interest on interest).",
        points: [
          "Simple Interest (সরল মুনাফা): I = Pnr (where r = R/100); Total Amount A = P(1 + nr).",
          "Doubling/Tripling in SI Formula: If Principal becomes m times in n years, Rate R = [(m - 1) / n] × 100%. (For doubling: m = 2 => Rate × Time = 100%).",
          "Compound Interest (চক্রবৃদ্ধি মুনাফা): Amount C = P(1 + r)^n; Compound Interest = C - P. Half-yearly compounding: halve the rate (r/2) and double periods (2n).",
          "2-Year & 3-Year CI − SI Gap: CI₂ - SI₂ = P × (R / 100)². CI₃ - SI₃ = P(R/100)² × [(300 + R)/100].",
        ],
        workedExamples: [
          "Example 1 (Tripling): In how many years will a sum triple itself at 10% simple interest? Here m = 3, R = 10 -> n = [(3 - 1) × 100] / 10 = 200/10 = 20 years (Check: I = P × 20 × 0.10 = 2P => Amount = 3P).",
          "Example 2 (2-Year Gap): If CI − SI for 2 years at 5% rate is ৳15, find Principal P. Formula: 15 = P × (5/100)² = P × 1/400 => P = ৳6,000 (Check: SI₂ = 600, CI₂ = 6000×1.05² - 6000 = 615 => Gap = ৳15).",
          "Example 3 (3-Year Gap): For P = ৳10,000 at R = 10% for 3 years, CI₃ - SI₃ = 10000 × (10/100)² × (310/100) = 100 × 3.1 = ৳310 (Check: CI₃ = 3,310, SI₃ = 3,000).",
        ],
      },
      {
        heading: "Chapter 5: Time-Work, Pipes-Cisterns, Trains & Boat-Stream",
        explanation:
          "Use the LCM Unit-Work method (or combined rate formula) so fractions never slow you down in the exam hall.",
        points: [
          "1. LCM Work Method: Instead of assuming total work = 1, set Total Work = LCM(days). Divide by individual days to get integer Units/Day efficiency!",
          "2. Alternating / Leaving Mid-Way: Sum efficiency units completed while working together, subtract from LCM total work, divide remainder by solo efficiency.",
          "3. Pipes Filling (A in x hrs, B in y hrs) & Emptying (C in z hrs): Net 1-hr work = 1/x + 1/y - 1/z.",
          "4. Relative Speed, Trains & Average Speed: Opposite direction -> Speeds ADD (v₁ + v₂); Same direction -> Speeds SUBTRACT (|v₁ - v₂|). Convert: km/h × (5/18) = m/s; m/s × (18/5) = km/h. Total distance to cross a bridge/train = Sum of BOTH lengths. For equal distances at x & y km/h, Average Speed = 2xy/(x+y).",
          "5. Boat & Stream Round Trip: Downstream D = b + c, Upstream U = b - c. Round-trip total time T across one-way distance d => Distance d = T(b² - c²) / (2b).",
        ],
        workedExamples: [
          "Example 1 (Train): A train 150m long runs at 54 km/h. How long to pass a 250m bridge? Step: Speed = 54 × 5/18 = 15 m/s; Total Distance = 150 + 250 = 400m -> Time = 400/15 = 26 2/3 sec (~26.67s).",
          "Example 2 (LCM Work): A does work in 12d, B in 18d. Take LCM(12,18) = 36 units. A = 3 u/d, B = 2 u/d -> Together = 5 u/d -> Days = 36/5 = 7.2 days.",
          "Example 3 (Average Speed & Boat): (a) Driving 40 km/h going and 60 km/h returning gives Avg Speed = (2×40×60)/(40+60) = 48 km/h. (b) Boat speed b = 10 km/h, stream c = 2 km/h, round trip T = 5h -> Distance d = 5(10² - 2²)/(2×10) = 480/20 = 24 km (Check: 24/12 + 24/8 = 2 + 3 = 5h).",
        ],
      },
    ],
    mcqSubjectFilter: "Math & Mental Ability",
    order: 8,
  },
  {
    title: "Algebra, Logarithms, Set Theory & Geometry Master Formulas",
    slug: "math-algebra-log-geometry",
    subject: "Math & Mental Ability",
    unit: "Algebra & Geometry",
    targetTracks: ["BCS", "Bank & Financial", "Primary & NTRCA", "Grade 11-20"],
    estimatedMinutes: 40,
    highYieldSummary:
      "Complete reference manual of algebraic identities, quadratic roots, exponents & logarithms (including 2026 NCTB Class 9–10 Ch 4 Characteristic & Mantissa), finite series, sets & combinatorics (nPr/nCr/Probability), and essential angle/area/mensuration identities frequently tested in BCS, Primary, NTRCA, and Grade 11–20 exams.",
    keyFacts: [
      "Core Identities: (a+b)³ = a³+b³+3ab(a+b), (a-b)³ = a³-b³-3ab(a-b), a³±b³ = (a±b)(a²∓ab+b²). If (x + 1/x) = a => x² + 1/x² = a² - 2 and x³ + 1/x³ = a³ - 3a; if (x - 1/x) = a => x² + 1/x² = a² + 2 and x³ - 1/x³ = a³ + 3a.",
      "Logarithm Laws (base a > 0, a ≠ 1, M, N > 0): log_a(1) = 0; log_a(a) = 1; log_a(MN) = log_a(M) + log_a(N); log_a(M/N) = log_a(M) - log_a(N); log_a(M^k) = k·log_a(M); Change of base: log_a(M) = ln(M) / ln(a) and log_a(b) × log_b(a) = 1.",
      "Characteristic & Mantissa (2026 NCTB Math Ch 4): Express N = a × 10^n (1 ≤ a < 10, n ∈ ℤ), so log₁₀(N) = n + log₁₀(a). Characteristic = n (for N ≥ 1 with m integer digits: m - 1; for 0 < N < 1 with k zeros right after decimal: -(k + 1) written as bar); Mantissa = log₁₀(a) is ALWAYS non-negative (0 ≤ Mantissa < 1).",
      "Set & Counting: |A ∪ B| = |A| + |B| - |A ∩ B|. Power Set |P(A)| = 2^n; Proper Subsets = 2^n - 1 (non-empty proper = 2^n - 2). Permutation nPr = n!/(n-r)!; Combination nCr = n! / [r!(n-r)!].",
      "Angle & Area Essentials: Polygon interior sum = (n - 2) × 180°; Exterior sum = 360°; Equilateral triangle area = (√3 / 4)a²; Circle area = πr²; Pythagorean triples: (3,4,5), (5,12,13), (8,15,17), (7,24,25).",
    ],
    memoryTricks: [
      "Negative Log Mantissa Trap: If log₁₀(N) = -2.69897, do NOT take Mantissa as -0.69897! Rewrite as -3 + 0.30103 = 3̄.30103 -> Characteristic = -3 (3̄), Mantissa = +0.30103.",
      "Angle inscribed at the center of a circle is ALWAYS double the angle at the circumference standing on the same arc; opposite angles of a cyclic quadrilateral sum to 180°.",
      "Number of diagonals in an n-sided polygon = n(n - 3) / 2 (e.g., Hexagon: 6×3/2 = 9).",
    ],
    quickExamples: [
      { label: "x + 1/x = 4 => x³ + 1/x³", detail: "4³ - 3(4) = 64 - 12 = 52" },
      { label: "log₁₀(0.002) Characteristic & Mantissa", detail: "2 × 10⁻³ -> Characteristic = -3 (3̄), Mantissa = log₁₀(2) ≈ 0.30103" },
      { label: "Power set & proper subsets (n = 4)", detail: "|P(A)| = 2⁴ = 16; Proper subsets = 2⁴ - 1 = 15" },
      { label: "Sum of first n odd numbers", detail: "n² (e.g., 1+3+5+7+9 = 5² = 25)" },
    ],
    chapters: [
      {
        heading: "Chapter 1: Algebraic Identities, Quadratics, Indices & Logarithms (NCTB Ch 4)",
        explanation:
          "Master cubic & reciprocal identities (x ± 1/x), quadratic discriminant conditions, laws of indices, and 2026 NCTB Class 9–10 Chapter 4 Logarithm rules including Characteristic & Mantissa.",
        points: [
          "1. Must-Know Square & Cube Identities: (a+b)² = (a-b)² + 4ab; (a-b)² = (a+b)² - 4ab; 2(a²+b²) = (a+b)² + (a-b)²; 4ab = (a+b)² - (a-b)²; (a+b)³ = a³ + 3a²b + 3ab² + b³ = a³ + b³ + 3ab(a+b); (a-b)³ = a³ - 3a²b + 3ab² - b³ = a³ - b³ - 3ab(a-b).",
          "2. Value & Factor Forms of Cubes: a³ + b³ = (a+b)³ - 3ab(a+b) = (a+b)(a² - ab + b²); a³ - b³ = (a-b)³ + 3ab(a-b) = (a-b)(a² + ab + b²). Also (a+b+c)² = a²+b²+c² + 2(ab+bc+ca) and a³+b³+c³-3abc = (a+b+c)[a²+b²+c²-ab-bc-ca] (equals 0 if a+b+c = 0!).",
          "3. Reciprocal Ladder: (x + 1/x)² - (x - 1/x)² = 4. If x = √3 + √2 (notice (√3)² - (√2)² = 1!), then 1/x = √3 - √2 => x + 1/x = 2√3 and x - 1/x = 2√2! Also x⁴ + 1/x⁴ = (x² + 1/x²)² - 2.",
          "4. Quadratic ax² + bx + c = 0: Discriminant D = b² - 4ac (D > 0 real distinct; D = 0 real & EQUAL; D < 0 imaginary); Roots sum α+β = -b/a, product αβ = c/a.",
          "5. Laws of Indices: a^m · a^n = a^(m+n); a^m / a^n = a^(m-n); (a^m)^n = a^(mn); a⁰ = 1 (a ≠ 0); a^(-m) = 1/a^m; a^(m/n) = ⁿ√(a^m). If a^x = a^y (a > 0, a ≠ 1) => x = y; if a^x = b^x (a ≠ b, a,b > 0) => x = 0.",
          "6. Logarithm Laws & Base Change: a^x = M <=> log_a(M) = x (a > 0, a ≠ 1, M > 0; zero/negative numbers have NO real log). Core laws: log_a(1) = 0; log_a(a) = 1; log_a(MN) = log_a(M) + log_a(N); log_a(M/N) = log_a(M) - log_a(N); log_a(M^k) = k·log_a(M); Change of base: log_a(M) = log_b(M)/log_b(a) = ln(M)/ln(a), and log_a(b)·log_b(a) = 1.",
          "7. Characteristic & Mantissa (সাধারণ লগের পূর্ণক ও অংশক — NCTB Ch 4): Write N = a × 10^n (1 ≤ a < 10). Characteristic (পূর্ণক) = n: if N ≥ 1 with m digits before decimal, Char = m - 1; if 0 < N < 1 with k zeros right after decimal, Char = -(k + 1) = bar(k+1). Mantissa (অংশক) = log₁₀(a), ALWAYS positive (0 ≤ Mantissa < 1).",
        ],
        workedExamples: [
          "Example 1 (Reciprocal): (a) If x² - 3x + 1 = 0, divide by x => x + 1/x = 3 => x² + 1/x² = 3² - 2 = 7 and x³ + 1/x³ = 3³ - 3(3) = 18. (b) If x - 1/x = 3, then x² + 1/x² = 3² + 2 = 11 and x³ - 1/x³ = 3³ + 3(3) = 36.",
          "Example 2 (Logarithm & Base Change): (a) Find log_√3(27): (√3)^x = 27 => 3^(x/2) = 3³ => x = 6. (b) Simplify log₂(80) - log₂(5) = log₂(80/5) = log₂(16) = 4.",
          "Example 3 (Characteristic & Mantissa): Given log₁₀(2) ≈ 0.30103: (a) 2000 = 2 × 10³ => log₁₀(2000) = 3.30103 (Char = 3, Mant = 0.30103). (b) 0.002 = 2 × 10⁻³ => log₁₀(0.002) = -3 + 0.30103 = 3̄.30103 = -2.69897 (Char = -3 or 3̄, Mant = +0.30103!).",
        ],
      },
      {
        heading: "Chapter 2: Series, Sets, Venn Diagrams, Counting & Probability",
        explanation:
          "Finite Arithmetic/Geometric series plus Sets (Power Sets, Venn formulas) and Basic Probability appear in virtually every BCS Preliminary paper.",
        points: [
          "1. Arithmetic Progression (AP — সমান্তর ধারা): nth term = a + (n-1)d; Sum S_n = (n/2)[2a + (n-1)d] = n × [(first + last)/2]. Special sums: 1+2+...+n = n(n+1)/2; 1²+2²+...+n² = n(n+1)(2n+1)/6; 1³+2³+...+n³ = [n(n+1)/2]².",
          "2. Geometric Progression (GP — গুণোত্তর ধারা): nth term = a·r^(n-1); Finite sum S_n = a(r^n - 1)/(r - 1) if r > 1 (or a(1 - r^n)/(1 - r) if r < 1); Infinite sum (|r| < 1) = a / (1 - r).",
          "3. Sets & Venn Formulas: |A ∪ B| = |A| + |B| - |A ∩ B|; 3-Set: |A ∪ B ∪ C| = |A| + |B| + |C| - |A ∩ B| - |B ∩ C| - |C ∩ A| + |A ∩ B ∩ C|. 'Only A' = |A| - |A ∩ B|; Neither = Total - |A ∪ B|. Power Set |P(A)| = 2^n; Proper subsets = 2^n - 1; Non-empty proper subsets = 2^n - 2.",
          "4. Permutation (order matters) vs Combination (selection): Repeating letters in 'BANANA' (6 letters, 3 A's, 2 N's) = 6! / (3! × 2!) = 60. Circular permutation of n distinct items = (n - 1)!. Handshakes among n people = nC₂ = n(n-1)/2.",
          "5. Probability: P(E) = Favorable / Total (0 ≤ P(E) ≤ 1); P(not E) = 1 - P(E). Independent AND -> P(A)×P(B); Mutually exclusive OR -> P(A)+P(B).",
        ],
        workedExamples: [
          "Example 1 (Sets): If |A| = 25, |B| = 20, |A ∩ B| = 8 inside a class of 50, then |A ∪ B| = 25 + 20 - 8 = 37, and Neither = 50 - 37 = 13. For A = {a, b, c, d}, |P(A)| = 2⁴ = 16 and Proper Subsets = 2⁴ - 1 = 15.",
          "Example 2 (Counting): In a room of 10 persons, each shakes hands with every other person once. Total handshakes = 10C₂ = (10×9)/2 = 45.",
        ],
      },
      {
        heading: "Chapter 3: Basic Angles, Polygons, Circle Geometry & Mensuration",
        explanation:
          "Geometry and Mensuration questions test angle relationships, polygon sums, triangle/quadrilateral/circle areas, and 3D surface/volume formulas.",
        points: [
          "1. Angles & Triangles: Complementary (পূরক) sum = 90°; Supplementary (সম্পূরক) sum = 180°. Exterior angle of a triangle = sum of the two opposite interior angles. Triangle inequality: Sum of any two sides > 3rd side; Difference of two sides < 3rd side. Centroid divides each median in 2:1 ratio.",
          "2. Polygon Identities (n sides): Sum of interior angles = (n - 2) × 180° (each regular interior angle = [(n-2)×180°]/n); Sum of ALL exterior angles = 360° (each regular exterior angle = 360°/n); Diagonals = n(n - 3)/2.",
          "3. 2D Area Formulas: Triangle = ½·b·h; Heron = √[s(s-a)(s-b)(s-c)] where s=(a+b+c)/2; Equilateral = (√3/4)a² (height = (√3/2)a); Isosceles (base b, equal sides a) = (b/4)√(4a² - b²). Parallelogram = b × h; Rhombus = ½ × d₁ × d₂ (diagonals bisect at 90°); Trapezium = ½(a + b) × h; Square diagonal = a√2; Circle area = πr², Circumference = 2πr, Sector area = (θ/360°)πr².",
          "4. Circle & Tangent Facts: Inscribed angle in a semicircle = 90°; Tangent is perpendicular (90°) to radius at point of contact; Center angle = 2 × circumference angle on same arc; Two tangents from an external point to a circle are EQUAL in length.",
          "5. 3D Solids: Cube Volume = a³, Total Surface = 6a², Diagonal = a√3; Cylinder Volume = πr²h, Curved Surface = 2πrh, Total Surface = 2πr(r+h); Cone Volume = ⅓πr²h, Curved Surface = πrl (l = √(r²+h²)); Sphere Volume = (4/3)πr³, Surface = 4πr².",
        ],
        workedExamples: [
          "Example 1 (Angles & Polygon): (a) For ANY acute angle x, Supplementary - Complementary = (180° - x) - (90° - x) = ALWAYS 90°! (b) Regular Hexagon (n = 6): Each interior angle = (6-2)×180°/6 = 120°, exterior angle = 360°/6 = 60°, diagonals = 6(6-3)/2 = 9.",
          "Example 2 (Mensuration): If a Rhombus has diagonals 12 cm and 16 cm, Area = ½ × 12 × 16 = 96 cm² and each side = √(6² + 8²) = 10 cm (3-4-5 triple!). An equilateral triangle of side 4 cm has Area = (√3/4)×4² = 4√3 cm².",
        ],
      },
    ],
    mcqSubjectFilter: "Math & Mental Ability",
    order: 9,
  },
  {
    title: "Mental Ability: Clock Angles, Calendars, Direction, Series & Puzzles",
    slug: "math-mental-ability-tricks",
    subject: "Math & Mental Ability",
    unit: "Mental Ability & Analytical",
    targetTracks: ["BCS", "Bank & Financial"],
    estimatedMinutes: 30,
    highYieldSummary:
      "Mental Ability carries 15 deterministic marks in BCS Preliminary (and 50 in BCS Written) plus Analytical Ability in Bank exams. With structured formulas covering Clocks, Calendars & Leap Years, Mirror/Water Reflection, Direction & Shadow Sense, Triangle/Square Counting, and Number/Letter Series, you can guarantee top scores.",
    keyFacts: [
      "Clock Angle Formula between Hour (H) & Minute (M) hands: θ = |11M - 60H| / 2. (If θ > 180°, that is the reflex angle; subtract from 360° for the smaller/minor angle).",
      "Mirror & Water Image Shortcuts: Mirror time = 11:60 - time (or 23:60 - time for 12:xx/24h; note 0:xx = 12:xx). Water time = 18:30 - time (or 17:90 - time if minutes > 30).",
      "Calendar & Leap Year Rule: Ordinary year (365d) = 1 odd day; Leap year (366d) = 2 odd days. Non-century years divisible by 4 are leap years; century years MUST be divisible by 400 (1600 & 2000 ARE leap years; 1900 & 2100 are NOT leap years!).",
      "Figure Counting: Vertex-divided triangle with n base parts & k horizontal levels = [n(n+1)/2] × k. Square with 2 diagonals (4 small parts) = 2×4 = 8 triangles; Square with 2 diagonals + 2 midlines (8 small parts) = 2×8 = 16 triangles.",
      "Direction Sense & Shadow Rule: Draw a + compass (N up, E right, S down, W left) and use Pythagoras right-triangle triples (3-4-5, 5-12-13). Morning Sun (East) casts shadows WEST; Evening Sun (West) casts shadows EAST.",
    ],
    memoryTricks: [
      "Word Mirror Test: 11 symmetric vertical capital letters look IDENTICAL in a vertical mirror: A, H, I, M, O, T, U, V, W, X, Y.",
      "Clock Hand Coincidence Check: Hands overlap (0°) 11 times in 12h (22 in 24h); opposite (180°) 11 times in 12h (22 in 24h); straight line (0° OR 180°) = 22 times in 12h (44 in 24h); right angle (90°) = 22 times in 12h (44 in 24h).",
      "Coding Anchor 'EJOTY': E=5, J=10, O=15, T=20, Y=25; opposite letter pairs ALWAYS add to 27 (A=1 & Z=26 -> 27; G=7 & T=20 -> 27).",
    ],
    quickExamples: [
      { label: "Clock angle at 3:30 & 12:30", detail: "3:30 => |11(30)-60(3)|/2 = 75°; 12:30 => |330-720|/2 = 195° (reflex) -> minor = 360°-195° = 165°" },
      { label: "Mirror time of 4:40 & 11:20", detail: "11:60 - 4:40 = 7:20; 11:60 - 11:20 = 0:40 (= 12:40)" },
      { label: "Leap Year Trap: 1900 vs 2000", detail: "1900 ÷ 400 ≠ integer (NOT leap); 2000 ÷ 400 = 5 (LEAP year)" },
      { label: "Morning shadow facing North", detail: "Sun in East -> shadow falls West, which is to your LEFT!" },
    ],
    chapters: [
      {
        heading: "Chapter 1: Clock Angles, Coincidences & Mirror/Water Reflections",
        explanation:
          "A standard analog clock has 360° divided into 60 minute spaces (6° per minute). The Minute hand travels 6°/min while the Hour hand travels 0.5°/min — giving a net relative speed of 5.5°/min (= 11/2°/min).",
        points: [
          "Angle Between Hands: θ = |11M - 60H| / 2 (use H = 1..12, or H = 0 for 12:xx). If θ > 180°, θ is the reflex angle; the smaller (minor) angle is 360° - θ.",
          "Hand Overlap / Straight Line Facts: Hands overlap (0°) 11 times in 12h (between 11:00 and 1:00 they coincide only ONCE at 12:00); Hands are opposite (180°) 11 times in 12h (between 5:00 and 7:00 only ONCE at 6:00) -> Total straight-line positions (0° or 180°) = 22 times in 12h (44/day); Right angles (90°) = 22 times in 12h (44/day).",
          "Mirror Time (দর্পণ প্রতিবিম্ব): Subtract from 11:60 (use 23:60 when H = 12 or 24h format; read 0:xx as 12:xx). E.g., mirror of 12:25 -> 23:60 - 12:25 = 11:35; mirror of 11:20 -> 11:60 - 11:20 = 0:40 = 12:40.",
          "Water Time (জল প্রতিবিম্ব): Subtract from 18:30 (or 17:90 if minutes > 30; subtract 12 if hour > 12). E.g., water time of 4:40 -> 17:90 - 4:40 = 13:50 (= 1:50).",
          "Symmetric Capitals: Vertical Mirror identical (11): A, H, I, M, O, T, U, V, W, X, Y. Horizontal Water identical (9): B, C, D, E, H, I, K, O, X.",
        ],
        workedExamples: [
          "Example 1 (Minor vs Reflex Angle): At 12:30 (H=12, M=30), θ = |11(30) - 60(12)|/2 = |330 - 720|/2 = 195° (reflex angle). Smaller angle = 360° - 195° = 165° (Check with H=0: |330 - 0|/2 = 165°).",
          "Example 2 (0° Overlap): At what time between 4 and 5 o'clock are the hands together (0°)? Set θ = 0 => 11M - 60(4) = 0 => M = 240/11 = 21 9/11 minutes past 4.",
        ],
      },
      {
        heading: "Chapter 2: Calendar Odd-Days, Leap Years, Direction Sense & Blood Relations",
        explanation:
          "Odd days = remaining days after dividing total days by 7. Combine leap-year century cycles with compass-shadow geometry and generation trees.",
        points: [
          "Leap Year & Odd Days: Ordinary year (365 = 52×7 + 1) -> 1 odd day (Jan 1 & Dec 31 share the SAME weekday!). Leap year (366 = 52×7 + 2) -> 2 odd days. Leap test: divisible by 4, EXCEPT century years must be divisible by 400 (2000 = leap; 1900 & 2100 = NOT leap).",
          "Century Odd Days Pattern: 100 yrs = 5 odd days; 200 yrs = 3; 300 yrs = 1; 400 yrs = 0 odd days! (Because 100 yrs has 24 leap + 76 ordinary = 124d -> 5 odd days; 400th year adds 1 extra leap day -> 21 ≡ 0).",
          "Repeating Calendar Shortcut (within same century without crossing a non-leap century like 2100): Leap year repeats after +28 years (2024 = 2052); Year right after Leap (Leap+1) repeats after +6 years (2025 = 2031); Leap+2 or Leap+3 repeats after +11 years (2026 = 2037).",
          "Direction Sense & Shadow Rules: Right turn = +90° clockwise; Left turn = +90° counter-clockwise. Track net North-South and East-West displacement, then apply √(Δx² + Δy²). Morning Sun (East) -> all shadows point West; Evening Sun (West) -> all shadows point East (at 12 noon, minimal/no directional shadow).",
          "Blood Relation Tree Notation: Box `[Male]`, Circle `(Female)`, Horizontal `=` Marriage, Vertical Parent->Child. Always trace generation levels step-by-step backward from the speaker.",
        ],
        workedExamples: [
          "Example 1 (Calendar): 1 January 2026 was Thursday -> 1 January 2027? Since 2026 is ordinary (Feb has 28 days), add +1 odd day -> Friday! (Always verify whether Feb 29 falls BETWEEN the two dates before adding +2).",
          "Example 2 (Direction): A walks 3 km North, turns right and walks 4 km East. Find shortest distance & direction from start. Step: ΔN = 3 km, ΔE = 4 km -> Distance = √(3² + 4²) = 5 km North-East.",
        ],
      },
      {
        heading: "Chapter 3: Figure Counting, Number/Letter Series & Coding-Decoding",
        explanation:
          "Use deterministic summation formulas for grid triangles/squares and difference trees or EJOTY positions for BCS number and letter series.",
        points: [
          "Squares inside an n × n Grid: 1² + 2² + ... + n² (for 3×3 grid = 1+4+9 = 14 squares). Inside m × n grid: m·n + (m-1)(n-1) + ... until either factor reaches 1.",
          "Rectangles inside an m × n Grid (including squares): [m(m+1)/2] × [n(n+1)/2] (e.g., 3×3 grid = 6×6 = 36 rectangles, so 36 - 14 = 22 non-square rectangles).",
          "Triangles in Divided Figures: (a) Triangle split into n vertical segments with k horizontal base levels = [n(n+1)/2] × k. (b) Square with 2 diagonals (4 small triangular parts meeting at center) = 2 × 4 = 8 triangles; Square with 2 diagonals + 2 midlines (8 small parts) = 2 × 8 = 16 triangles!",
          "Number Series Diagnosis Protocol: Step 1 Check Difference (d₁, d₂...); Step 2 Check Second-Order Difference; Step 3 Check ×2 ± k or n² ± n / n³ ± n; Step 4 Check Alternating dual series (odd vs even positions).",
          "Letter Series & Coding ('EJOTY' Anchor): E=5, J=10, O=15, T=20, Y=25. Reverse alphabet letter sum ALWAYS equals 27 (e.g., A(1) opposite Z(26) -> 1+26 = 27; G(7) opposite T(20)). Convert letters to numbers to spot differences instantly!",
        ],
        workedExamples: [
          "Example 1 (Number Series): 2, 6, 12, 20, 30, ? -> Pattern: 1×2, 2×3, 3×4, 4×5, 5×6 => Next is 6×7 = 42 (or first differences: +4, +6, +8, +10, +12).",
          "Example 2 (Letter Series): B, E, I, N, ? -> Convert via EJOTY: B(2), E(5), I(9), N(14). Gaps: +3, +4, +5 -> Next gap +6 => 14 + 6 = 20 = T!",
        ],
      },
    ],
    mcqSubjectFilter: "Math & Mental Ability",
    order: 10,
  },
];
