export interface PayGradeInfo {
  grade: number;
  label: string;
  typicalRoles: string;
  basic2015: number;
  basic2026: number;
}

/**
 * Reference table combining the 2015 National Pay Scale baselines and the
 * 9th National Pay Scale 2026 (Service Order 2026) key milestone anchors:
 * - Grades 1-11: up to 100% increase (doubled from 2015)
 * - Grades 12-20: 115% to 142.4% increase (Grade 20 raised from 8,250 to 20,000)
 */
export const PAY_GRADES_2026: PayGradeInfo[] = [
  { grade: 1, label: "Grade 1", typicalRoles: "Secretary / Senior Official (Fixed)", basic2015: 78000, basic2026: 156000 },
  { grade: 2, label: "Grade 2", typicalRoles: "Additional Secretary / Director General", basic2015: 66000, basic2026: 132000 },
  { grade: 3, label: "Grade 3", typicalRoles: "Joint Secretary / DIG", basic2015: 56500, basic2026: 113000 },
  { grade: 4, label: "Grade 4", typicalRoles: "Director / Deputy Secretary (Senior)", basic2015: 50000, basic2026: 100000 },
  { grade: 5, label: "Grade 5", typicalRoles: "Deputy Secretary / SP / Associate Prof", basic2015: 43000, basic2026: 86000 },
  { grade: 6, label: "Grade 6", typicalRoles: "UNO / Senior Assistant Secretary / Addl. SP", basic2015: 35500, basic2026: 71000 },
  { grade: 7, label: "Grade 7", typicalRoles: "Senior Officer / Sub-Divisional Engineer", basic2015: 29000, basic2026: 58000 },
  { grade: 8, label: "Grade 8", typicalRoles: "Senior Lecturer / Senior Assistant Director", basic2015: 23000, basic2026: 46000 },
  { grade: 9, label: "Grade 9", typicalRoles: "BCS Cadre Entry (AC, ASP, AD, Lecturer, AE)", basic2015: 22000, basic2026: 44000 },
  { grade: 10, label: "Grade 10", typicalRoles: "Sub-Assistant Engineer / Bank Officer / SI", basic2015: 16000, basic2026: 32000 },
  { grade: 11, label: "Grade 11", typicalRoles: "Auditor / Junior Instructor / Supervisor", basic2015: 12500, basic2026: 25000 },
  { grade: 12, label: "Grade 12", typicalRoles: "Personal Officer / Head Assistant", basic2015: 11300, basic2026: 24300 },
  { grade: 13, label: "Grade 13", typicalRoles: "Primary Assistant Teacher / Steno-Typist / Operator", basic2015: 11000, basic2026: 23800 },
  { grade: 14, label: "Grade 14", typicalRoles: "Account Assistant / Lab Assistant", basic2015: 10200, basic2026: 22600 },
  { grade: 15, label: "Grade 15", typicalRoles: "Office Assistant-cum-Computer Typist", basic2015: 9700, basic2026: 21800 },
  { grade: 16, label: "Grade 16", typicalRoles: "Junior Clerk / Store Keeper / Driver", basic2015: 9300, basic2026: 21200 },
  { grade: 17, label: "Grade 17", typicalRoles: "Cash Sarkar / Technical Attendant", basic2015: 9000, basic2026: 20800 },
  { grade: 18, label: "Grade 18", typicalRoles: "Photocopy Operator / Dispatch Rider", basic2015: 8800, basic2026: 20500 },
  { grade: 19, label: "Grade 19", typicalRoles: "Security Guard / Gardener / Messenger", basic2015: 8500, basic2026: 20200 },
  { grade: 20, label: "Grade 20", typicalRoles: "Office Sahayak / Support Staff", basic2015: 8250, basic2026: 20000 },
];

export type PayPhase = "phase1" | "phase2" | "phase3";
export type CityTier = "dhaka" | "metro" | "district";

export function calculateEstimatedSalary(
  gradeInfo: PayGradeInfo,
  phase: PayPhase,
  city: CityTier
) {
  const diff = gradeInfo.basic2026 - gradeInfo.basic2015;
  const isGrade9OrAbove = gradeInfo.grade <= 9;

  let factor = 1;
  if (phase === "phase1") factor = isGrade9OrAbove ? 0.4 : 0.5;
  if (phase === "phase2") factor = isGrade9OrAbove ? 0.7 : 0.75;

  const activeBasic = Math.round(gradeInfo.basic2015 + diff * factor);

  // Standard Bangladesh govt house rent & allowance ratios (approximate guide)
  let houseRentRate = 0.4;
  if (city === "dhaka") {
    houseRentRate = gradeInfo.grade <= 10 ? 0.55 : 0.6;
  } else if (city === "metro") {
    houseRentRate = gradeInfo.grade <= 10 ? 0.45 : 0.5;
  } else {
    houseRentRate = gradeInfo.grade <= 10 ? 0.4 : 0.45;
  }

  const houseRent = Math.round(activeBasic * houseRentRate);
  const medicalAllowance = 1500;
  const tiffinAllowance = gradeInfo.grade >= 11 ? 200 : 0;
  const transportAllowance = city === "dhaka" && gradeInfo.grade >= 11 ? 300 : 0;

  const grossEstimate =
    activeBasic + houseRent + medicalAllowance + tiffinAllowance + transportAllowance;

  return {
    activeBasic,
    houseRent,
    medicalAllowance,
    otherAllowances: tiffinAllowance + transportAllowance,
    grossEstimate,
    phasePercent: Math.round(factor * 100),
  };
}
