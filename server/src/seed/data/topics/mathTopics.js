export const mathTopics = [
  {
    title: "Arithmetic Shortcuts: Percentage, Profit-Loss, Interest & Work-Time",
    slug: "math-arithmetic-shortcuts",
    subject: "Math & Mental Ability",
    unit: "Arithmetic Core (BCS + Bank)",
    targetTracks: ["BCS", "Bank & Financial", "Primary & NTRCA", "Grade 11-20"],
    estimatedMinutes: 40,
    highYieldSummary:
      "Percentage, Ratio-Mixture, Profit-Loss-Discount, Simple & Compound Interest, Work-Pipe-Cistern, and Boat-Train problems decide more than 60% of Mathematics marks in BCS, Bangladesh Bank, Primary, and Ministry written/MCQ exams. Master every underlying concept plus 10-second mental shortcuts.",
    keyFacts: [
      "Successive Percentage Change Shortcut: Net % change = a + b + (ab / 100). If price increases by x% and then decreases by x%, overall ALWAYS decreases by (x² / 100)%!",
      "Consumption Constant Formula: If commodity price rises by R%, reduce consumption by [R / (100 + R)] × 100% to keep expenditure unchanged.",
      "Profit & Loss Base Rule: Profit% and Loss% are ALWAYS calculated on Cost Price (CP) unless explicitly stated otherwise. Selling two articles at the SAME selling price where one gives x% profit & the other gives x% loss => Overall ALWAYS Loss = (x² / 100)%.",
      "Work-Time / Pipe Combined Formula: If A takes x days and B takes y days, together they finish in (xy) / (x + y) days. Man-Day work rule: (M₁ × D₁ × H₁) / W₁ = (M₂ × D₂ × H₂) / W₂.",
      "Simple Interest (I = Pnr) & Compound Interest (C = P(1 + r)^n): Difference between CI and SI for 2 years at rate R% is P × (R / 100)².",
    ],
    memoryTricks: [
      "Benchmark Fractions to Memorize: 1/2 = 50%, 1/3 = 33.33%, 1/4 = 25%, 1/5 = 20%, 1/6 = 16.67%, 1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%, 1/12 = 8.33%.",
      "Average Speed for equal distances at speed x and y is NOT (x+y)/2 — it is Harmonic Mean: 2xy / (x + y).",
      "Boat & Stream: Downstream Speed D = b + s; Upstream Speed U = b - s; Speed of boat b = (D + U)/2, stream s = (D - U)/2.",
    ],
    quickExamples: [
      { label: "Price +25%, keep budget same", detail: "Reduce use by [25 / (100+25)] × 100 = 20%" },
      { label: "SI vs CI gap in 2 yrs (P=10,000, R=10%)", detail: "10000 × (10/100)² = ৳100 immediately!" },
      { label: "A in 10d, B in 15d together", detail: "(10 × 15) / (10 + 15) = 150 / 25 = 6 days" },
      { label: "Length +20%, Width -10% area", detail: "+20 - 10 + (20 × -10)/100 = +8% area increase" },
    ],
    chapters: [
      {
        heading: "Chapter 1: Percentage, Ratio, Proportion & Mixture Alligation",
        explanation:
          "Percentages represent fractions out of 100. Switching seamlessly between fraction multipliers and successive formulas lets you solve Bank & BCS word problems in seconds without tedious multiplication.",
        points: [
          "1. Base Shift Law (পণ্যমূল্য ও খরচ): If A is R% MORE than B, B is [R / (100 + R)] × 100% LESS than A. Conversely, if A is R% LESS than B, B is [R / (100 - R)] × 100% MORE than A.",
          "2. Successive Change (ক্রমিক পরিবর্তন): Two consecutive % changes a% and b% combine into Net % = a + b + (ab/100). Works for length×breadth rectangle area, tax-then-discount, population growth, or consecutive discounts (-d₁ - d₂ + d₁d₂/100).",
          "3. Population Compounding: Present P growing at R% annually -> After n years: P(1 + R/100)^n; n years ago: P / (1 + R/100)^n.",
          "4. Compound Ratio (ধারাবাহিক অনুপাত A:B:C): Given A:B = p:q and B:C = r:s, cross-multiply 'N'-pattern -> A:B:C = (p×r) : (q×r) : (q×s).",
          "5. Mixture & Replacement Rule: To equalize Milk:Water ratio from a total of T liters, calculate the UNCHANGED component's exact quantity first, then match it against the new ratio!",
        ],
        workedExamples: [
          "Example 1: Onion price falls by 20%. How much % consumption can increase without changing budget? Step: R = 20 (down), so increase = [20 / (100 - 20)] × 100 = 20/80 × 100 = 25%.",
          "Example 2: In a 60L milk-water mix (ratio 2:1), how much extra water makes the ratio 1:2? Step: Milk = 60×(2/3) = 40L, Water = 20L. Milk stays 40L (becomes '1' part). So Water must become '2' parts = 80L. Add 80 - 20 = 60L water!",
        ],
      },
      {
        heading: "Chapter 2: Profit-Loss, Marked Price Discount & False Weights",
        explanation:
          "Always identify Cost Price (CP = 100% baseline), Selling Price (SP), and Marked Price (MP) cleanly before plugging numbers into profit/loss ratios.",
        points: [
          "1. Profit % = [(SP - CP) / CP] × 100; Loss % = [(CP - SP) / CP] × 100. Reverse formula: CP = SP × 100 / (100 ± Profit/Loss%).",
          "2. 'Cost of x articles = Selling Price of y articles' Trap: Gain/Loss % = [(x - y) / y] × 100 (Positive -> Gain, Negative -> Loss).",
          "3. Dishonest Shopkeeper (False Weight): Selling at CP while weighing 'w' grams instead of '1000' grams -> Actual Profit % = [(1000 - w) / w] × 100 (Using 800g for 1kg = (200/800)×100 = 25% profit, NOT 20%!).",
          "4. Marked Price vs Discount Relationship: CP / MP = (100 - Discount%) / (100 + Profit%). This 1-line equation cracks ALL Bangladesh Bank Marked-Price questions!",
        ],
        workedExamples: [
          "Example 1: Selling an item at ৳480 causes a 20% loss. To gain 20%, what must SP be? Shortcut: 80% = 480 => 120% = (480/80) × 120 = ৳720.",
          "Example 2: If CP of 15 pens equals SP of 12 pens, find profit %. Formula: [(15 - 12)/12] × 100 = 3/12 × 100 = 25% profit.",
        ],
      },
      {
        heading: "Chapter 3: Simple Interest (SI), Compound Interest (CI) & Doubling",
        explanation:
          "Interest problems appear in both Primary/Grade 11-20 arithmetic and Combined Bank tests. Distinguish between Simple Interest (flat on initial principal P) and Compound Interest (interest on interest).",
        points: [
          "Simple Interest (সরল মুনাফা): I = Pnr (where r = R/100); Total Amount A = P(1 + nr).",
          "Doubling/Tripling in SI Formula: If Principal becomes m times in n years, Rate R = [(m - 1) / n] × 100%. (For doubling: m = 2 => Rate × Time = 100%).",
          "Compound Interest (চক্রবৃদ্ধি মুনাফা): Amount C = P(1 + r)^n; Compound Interest = C - P. Half-yearly compounding: halve the rate (r/2) and double periods (2n).",
          "2-Year CI − SI Gap: CI₂ - SI₂ = P × (R / 100)². 3-Year CI − SI Gap = P(R/100)² × [(300 + R)/100].",
        ],
        workedExamples: [
          "Example 1: In how many years will a sum triple itself at 10% simple interest? Here m = 3, R = 10 -> n = [(3 - 1) × 100] / 10 = 200/10 = 20 years.",
          "Example 2: If CI − SI for 2 years at 5% rate is ৳15, find Principal P. Formula: 15 = P × (5/100)² = P × 1/400 => P = 15 × 400 = ৳6,000.",
        ],
      },
      {
        heading: "Chapter 4: Time-Work, Pipes-Cisterns, Trains & Boat-Stream",
        explanation:
          "Use the LCM Unit-Work method (or combined rate formula) so fractions never slow you down in the exam hall.",
        points: [
          "1. LCM Work Method: Instead of assuming total work = 1, set Total Work = LCM(days). Divide by individual days to get integer Units/Day efficiency!",
          "2. Alternating / Leaving Mid-Way: Sum efficiency units completed while working together, subtract from LCM total work, divide remainder by solo efficiency.",
          "3. Pipes Filling (A in x hrs, B in y hrs) & Emptying (C in z hrs): Net 1-hr work = 1/x + 1/y - 1/z.",
          "4. Relative Speed & Trains: Opposite direction -> Speeds ADD (v₁ + v₂); Same direction -> Speeds SUBTRACT (|v₁ - v₂|). Unit conversion: km/h × (5/18) = m/s; m/s × (18/5) = km/h. Total distance to cross a bridge/another train = Sum of BOTH lengths (for pole/man, length = train length only).",
          "5. Boat & Stream Round Trip: Average boat speed in round trip across distance d (one-way speed b, current c) -> Total time T = d/(b+c) + d/(b-c) => Distance d = T(b² - c²) / (2b).",
        ],
        workedExamples: [
          "Example 1: A train 150m long runs at 54 km/h. How long to pass a 250m bridge? Step: Speed = 54 × 5/18 = 15 m/s; Total Distance = 150 + 250 = 400m -> Time = 400/15 = 26.67 sec.",
          "Example 2: A does work in 12d, B in 18d. Take LCM(12,18) = 36 units. A = 3 u/d, B = 2 u/d -> Together = 5 u/d -> Days = 36/5 = 7.2 days.",
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
      "Complete reference manual of algebraic identities, quadratic roots, exponents & logarithms, finite series, sets & combinatorics (nPr/nCr/Probability), and Euclidean plane/solid geometry theorems frequently tested in BCS, Primary, NTRCA, and Grade 11–20 exams.",
    keyFacts: [
      "Core Identities: If (x + 1/x) = a, then x² + 1/x² = a² - 2 and x³ + 1/x³ = a³ - 3a. If (x - 1/x) = a, then x² + 1/x² = a² + 2 and x³ - 1/x³ = a³ + 3a.",
      "Logarithm Laws: log_a(1) = 0; log_a(a) = 1; log_a(MN) = log_a(M) + log_a(N); log_a(M^k) = k·log_a(M); base change: log_a(b) × log_b(a) = 1.",
      "Set & Probability: n(A ∪ B) = n(A) + n(B) - n(A ∩ B). Subset count of a set with n elements = 2^n (Proper subsets = 2^n - 1). Permutation nPr = n!/(n-r)!; Combination nCr = n! / [r!(n-r)!].",
      "Polygon & Circle Geometry: Sum of interior angles of an n-sided polygon = (n - 2) × 180°; Sum of ALL exterior angles of ANY convex polygon = 360°; Equilateral triangle area = (√3 / 4)a².",
      "Right Triangle Triples (Pythagorean): (3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25) and their multiples.",
    ],
    memoryTricks: [
      "Angle inscribed at the center of a circle is ALWAYS double the angle at the circumference standing on the same arc!",
      "In a cyclic quadrilateral (বৃত্তস্থ চতুর্ভুজ), opposite angles always sum to 180°.",
      "Number of diagonals in an n-sided polygon = n(n - 3) / 2 (e.g., Hexagon: 6×3/2 = 9).",
    ],
    quickExamples: [
      { label: "x + 1/x = 4 => x³ + 1/x³", detail: "4³ - 3(4) = 64 - 12 = 52" },
      { label: "log₂(32)", detail: "log₂(2⁵) = 5" },
      { label: "Two parallel lines cut by transversal", detail: "Alternate & Corresponding angles are equal; interior same-side sum = 180°" },
      { label: "Sum of first n odd numbers", detail: "n² (e.g., 1+3+5+7+9 = 5² = 25)" },
    ],
    chapters: [
      {
        heading: "Chapter 1: Algebraic Identities, Quadratics, Exponents & Logs",
        explanation:
          "Master reciprocal power transformations (x ± 1/x), discriminant conditions for ax²+bx+c=0, and all laws of indices and logarithms.",
        points: [
          "1. Must-Know Power Identities: (a+b)² = (a-b)² + 4ab; (a-b)² = (a+b)² - 4ab; 2(a²+b²) = (a+b)² + (a-b)²; 4ab = (a+b)² - (a-b)²; a³+b³ = (a+b)³ - 3ab(a+b); a³-b³ = (a-b)³ + 3ab(a-b); a³+b³+c³-3abc = (a+b+c)[a²+b²+c²-ab-bc-ca] (equals 0 when a+b+c = 0!).",
          "2. Reciprocal Ladder: If x = √3 + √2 (notice (√3)² - (√2)² = 1!), then 1/x = √3 - √2! Therefore x + 1/x = 2√3 and x - 1/x = 2√2!",
          "3. Quadratic Equation ax² + bx + c = 0: Discriminant D = b² - 4ac. D > 0 -> real & distinct roots; D = 0 -> real & EQUAL roots; D < 0 -> imaginary roots. Sum of roots (α+β) = -b/a; Product (αβ) = c/a.",
          "4. Surds & Exponents: a⁰ = 1 (a ≠ 0); a^(-m) = 1/a^m; (a^m)^n = a^(mn); If a^x = a^y (a > 0, a ≠ 1) then x = y; If a^x = b^x (a ≠ b, a,b>0) then x = 0!",
          "5. Logarithm Core Rules: a^x = N <=> log_a(N) = x (where base a > 0, a ≠ 1, N > 0). Zero/Negative numbers have NO real logarithm! Change of base: log_a(b) = log_c(b) / log_c(a). Characteristic & Mantissa: integer & positive decimal parts of log₁₀.",
        ],
        workedExamples: [
          "Example 1: If x² - 3x + 1 = 0, find x² + 1/x². Step: Divide by x => x + 1/x = 3. Thus x² + 1/x² = 3² - 2 = 7.",
          "Example 2: Find value of log_√3(27). Step: (√3)^x = 27 => 3^(x/2) = 3³ => x/2 = 3 => x = 6.",
        ],
      },
      {
        heading: "Chapter 2: Series, Sets, Venn Diagrams, Counting & Probability",
        explanation:
          "Finite Arithmetic/Geometric series plus Sets and Basic Probability appear in virtually every 35th–46th BCS Preliminary paper.",
        points: [
          "1. Arithmetic Progression (AP — সমান্তর ধারা): nth term = a + (n-1)d; Sum S_n = (n/2)[2a + (n-1)d] = n × [(first + last)/2]. Special sums: 1+2+...+n = n(n+1)/2; 1²+2²+...+n² = n(n+1)(2n+1)/6; 1³+2³+...+n³ = [n(n+1)/2]².",
          "2. Geometric Progression (GP — গুণোত্তর ধারা): nth term = a·r^(n-1); Sum S_n = a(r^n - 1)/(r - 1) if r > 1; Infinite sum (|r| < 1) = a / (1 - r).",
          "3. Sets & 3-Set Formula: n(A ∪ B) = n(A) + n(B) - n(A ∩ B). Remember: 'Only A' = n(A) - n(A ∩ B); Neither = Total - n(A ∪ B). Power Set P(A) has 2^n subsets; proper subsets = 2^n - 1; non-empty proper subsets = 2^n - 2.",
          "4. Permutation (arrangement, order matters) vs Combination (selection, order does NOT matter): Repeating letters in word like 'BANANA' (6 letters, 3 A's, 2 N's) = 6! / (3! × 2!) = 60. Circular permutation of n distinct items = (n - 1)!. Handshakes among n people = nC₂ = n(n-1)/2.",
          "5. Probability: P(E) = Favorable / Total (always 0 ≤ P(E) ≤ 1); P(not E) = 1 - P(E). Independent events AND -> multiply P(A)×P(B); Mutually exclusive OR -> add P(A)+P(B).",
        ],
        workedExamples: [
          "Example: In a room of 10 persons, each shakes hands with every other person once. Total handshakes? -> 10C₂ = (10×9)/2 = 45.",
          "Example: How many subsets of A = {a, b, c, d} are PROPER subsets? -> 2⁴ - 1 = 16 - 1 = 15.",
        ],
      },
      {
        heading: "Chapter 3: Plane & Circle Geometry + Mensuration Formulas",
        explanation:
          "Geometry questions test angle rules, triangle similarity, circle chord-tangent properties, and area/volume mensuration.",
        points: [
          "1. Angles & Triangles: Complementary (পূরক) sum = 90°; Supplementary (সম্পূরক) sum = 180°. Exterior angle of triangle = sum of two opposite interior angles. Sum of two sides of a triangle > 3rd side; Difference of two sides < 3rd side. Centroid divides median in 2:1 ratio!",
          "2. Triangle Area: ½·b·h; Heron's formula √[s(s-a)(s-b)(s-c)] where s=(a+b+c)/2; Equilateral = (√3/4)a²; ½·ab·sin(C).",
          "3. Quadrilaterals: Parallelogram = base × height; Rhombus = ½ × d₁ × d₂ (diagonals bisect at 90°!); Trapezium = ½(a + b) × h; Square diagonal = a√2, Perimeter = 4a.",
          "4. Circle & Tangents: Inscribed angle in a semicircle = 90°; Tangent is perpendicular (90°) to radius at point of contact; Angle at center = 2 × angle at circumference on same arc; Two tangents from an external point to a circle are EQUAL in length.",
          "5. 3D Solids (Cube, Cylinder, Cone, Sphere): Cylinder Volume = πr²h, Curved Surface = 2πrh, Total Surface = 2πr(r+h); Cone Volume = ⅓πr²h; Sphere Volume = (4/3)πr³, Surface = 4πr².",
        ],
        workedExamples: [
          "Exam Favorite: The angle between an exterior side and complementary? E.g., If supplementary of angle x is (180-x) and complementary is (90-x), note (180-x) - (90-x) = ALWAYS 90°!",
        ],
      },
    ],
    mcqSubjectFilter: "Math & Mental Ability",
    order: 9,
  },
  {
    title: "Mental Ability: Clock Angles, Calendars, Series & Puzzles",
    slug: "math-mental-ability-tricks",
    subject: "Math & Mental Ability",
    unit: "Mental Ability & Analytical",
    targetTracks: ["BCS", "Bank & Financial"],
    estimatedMinutes: 30,
    highYieldSummary:
      "Mental Ability carries 15 deterministic marks in BCS Preliminary (and 50 in BCS Written) plus Analytical Ability in Bank exams. With 6 structured formulas covering Clocks, Calendars, Mirror/Water Reflection, Triangle/Square Counting, Direction/Shadow, and Syllogism/Coding, you can guarantee top scores.",
    keyFacts: [
      "Clock Angle Formula between Hour (H) & Minute (M) hands: Angle = |11M - 60H| / 2. (If > 180°, subtract from 360° for reflex vs minor angle).",
      "Mirror Image Time Shortcut: Subtract given time from 11:60 (or 23:60 for 12/24hr format). Water Image Shortcut: Subtract from 18:30 (or 17:90 if minutes > 30).",
      "Triangle Counting inside an n-part vertex-divided triangle: Sum 1 + 2 + ... + n; if k horizontal base cuts exist, multiply by k.",
      "Calendar Odd Days: Ordinary year (365d) = 1 odd day; Leap year (366d) = 2 odd days; Century leap rule: divisible by 400 (2000 is leap, 1900 & 2100 are NOT leap years).",
    ],
    memoryTricks: [
      "Direction Problems: Always draw a tiny + compass (N up, E right, S down, W left) and use Pythagoras right-triangle triples like 3-4-5 for final distance.",
      "Word Mirror Test: Symmetric vertical letters look IDENTICAL in a mirror: A, H, I, M, O, T, U, V, W, X, Y (11 capital letters).",
    ],
    quickExamples: [
      { label: "Angle at 3:30", detail: "|11(30) - 60(3)| / 2 = |330 - 180| / 2 = 75°" },
      { label: "Mirror time of 4:40", detail: "11:60 - 4:40 = 7:20" },
      { label: "29 Feb frequency", detail: "Every 4 years (except centuries not divisible by 400)" },
      { label: "180° straight clock hands", detail: "11 times in 12 hours (22 times in 24 hours)" },
    ],
    chapters: [
      {
        heading: "Chapter 1: Clock Angles, Coincidences & Mirror/Water Reflections",
        explanation:
          "A standard analog clock has 360° divided into 60 minute spaces (6° per minute). The Minute hand travels 6°/min while the Hour hand travels 0.5°/min — giving a net relative speed of 5.5°/min (= 11/2°/min).",
        points: [
          "Angle Between Hands: θ = |11M - 60H| / 2 (H in 12-hour format: use 12 or 0 for 12:xx). If the answer exceeds 180°, the smaller angle is 360° - θ.",
          "Hand Overlap / Straight Line Facts: Hands overlap (0°) 11 times in 12h (22 times/day, skipping 12–1 separately); Hands are opposite (180°) 11 times in 12h (22 times/day); Hands form 90° right angles 22 times in 12h (44 times/day)!",
          "Mirror Time (দর্পণ প্রতিবিম্ব): Always subtract from 11:60 (or 23:60 if hour is 12 or 24h format). E.g., mirror of 12:25 -> 23:60 - 12:25 = 11:35.",
          "Water Time (জল প্রতিবিম্ব): Subtract from 18:30 (or 17:90 if minutes > 30). E.g., water time of 4:40 -> 17:90 - 4:40 = 13:50 (= 1:50).",
          "Mirror Letters (11 Vertical Symmetric Capitals): A, H, I, M, O, T, U, V, W, X, Y. (Water horizontal symmetric letters: B, C, D, E, H, I, K, O, X).",
        ],
        workedExamples: [
          "Example: At what time between 4 and 5 o'clock are the hands together (0°)? Set θ = 0 => 11M - 60(4) = 0 => 11M = 240 => M = 21 9/11 minutes past 4.",
        ],
      },
      {
        heading: "Chapter 2: Calendar Odd-Days, Day Shifts & Blood Relations",
        explanation:
          "Odd days = remaining days after dividing total days by 7. Remember exact century odd-day cycles to find ANY historical weekday.",
        points: [
          "Year Odd Days: Ordinary year (365 = 52×7 + 1) -> 1 odd day (1st Jan & 31st Dec fall on the SAME weekday!). Leap year (366 = 52×7 + 2) -> 2 odd days.",
          "Century Odd Days Pattern: 100 yrs = 5 odd days; 200 yrs = 3; 300 yrs = 1; 400 yrs = 0 odd days! Note: 1600 & 2000 had 0 odd days; 1900 & 2100 are NOT leap years (must divide by 400!).",
          "Repeating Calendar Shortcut: Leap year repeats after +28 years (e.g., 2024 = 2052); Year after Leap repeats after +6 years; Other years repeat after +11 years.",
          "Blood Relation Tree Notation: Box `[Male]`, Circle `(Female)`, Horizontal `=` Marriage, Vertical Parent->Child. Always draw generations top-to-bottom from the narrator's reference backward!",
        ],
        workedExamples: [
          "Example: If 1 January 2026 was Thursday, what day is 1 January 2027? Since 2026 is ordinary (Feb has 28 days), add +1 odd day -> Friday! (Check if Feb 29 falls BETWEEN the two dates before adding +2).",
        ],
      },
      {
        heading: "Chapter 3: Figure Counting, Number Series, Coding & Analytical Reasoning",
        explanation:
          "Use deterministic summation formulas for grid triangles/squares and difference-of-difference trees for tricky BCS number series.",
        points: [
          "Squares inside an n × n Grid: 1² + 2² + ... + n² (for 3×3 grid = 1+4+9 = 14 squares!). Squares inside m × n grid: m·n + (m-1)(n-1) + ... until either reaches 1.",
          "Rectangles inside an m × n Grid (including squares): [m(m+1)/2] × [n(n+1)/2].",
          "Triangles in Divided Triangle: Vertical segments = n(n+1)/2 × horizontal levels k. Inside square with 2 diagonals (8 pieces): 2 × small parts = 8 triangles!",
          "Number Series Diagnosis Protocol: Step 1 Check Difference (d₁, d₂...); Step 2 Check Second-Order Difference; Step 3 Check ×2 ± k or n² ± n / n³ ± n; Step 4 Check Alternating dual series (odd positions separate from even positions).",
          "Coding-Decoding ('EJOTY' Anchor): E=5, J=10, O=15, T=20, Y=25. Reverse alphabet letter sum ALWAYS equals 27 (e.g., A(1) opposite Z(26) -> 1+26 = 27; G(7) opposite T(20)).",
        ],
        workedExamples: [
          "Series Trap: 2, 6, 12, 20, 30, ? -> Pattern: 1×2, 2×3, 3×4, 4×5, 5×6 => Next is 6×7 = 42! (Or differences: +4, +6, +8, +10, +12).",
        ],
      },
    ],
    mcqSubjectFilter: "Math & Mental Ability",
    order: 10,
  },
];
