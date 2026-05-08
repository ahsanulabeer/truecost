export const LOAN_TYPES = [
  {
    value: "30yr-fixed",
    label: "30-year Fixed",
    termMonths: 360,
    isArm: false,
    promptDescription: "30-year fixed rate",
  },
  {
    value: "20yr-fixed",
    label: "20-year Fixed",
    termMonths: 240,
    isArm: false,
    promptDescription: "20-year fixed rate",
  },
  {
    value: "15yr-fixed",
    label: "15-year Fixed",
    termMonths: 180,
    isArm: false,
    promptDescription: "15-year fixed rate",
  },
  {
    value: "10yr-fixed",
    label: "10-year Fixed",
    termMonths: 120,
    isArm: false,
    promptDescription: "10-year fixed rate",
  },
  {
    value: "5-1-arm",
    label: "5/1 ARM",
    termMonths: 360,
    isArm: true,
    promptDescription:
      "5/1 ARM (5-year initial fixed period, then annual adjustment over 30-year amortization)",
  },
  {
    value: "7-1-arm",
    label: "7/1 ARM",
    termMonths: 360,
    isArm: true,
    promptDescription:
      "7/1 ARM (7-year initial fixed period, then annual adjustment over 30-year amortization)",
  },
  {
    value: "10-1-arm",
    label: "10/1 ARM",
    termMonths: 360,
    isArm: true,
    promptDescription:
      "10/1 ARM (10-year initial fixed period, then annual adjustment over 30-year amortization)",
  },
];

export function getLoanType(value) {
  return LOAN_TYPES.find((l) => l.value === value) || LOAN_TYPES[0];
}
