// Existing 2026 assumptions preserved during the architecture migration.
export const federal2026 = {
  single: [
    [12400, 0.1],
    [50400, 0.12],
    [105700, 0.22],
    [201775, 0.24],
    [256225, 0.32],
    [640600, 0.35],
    [Infinity, 0.37],
  ],
  married: [
    [24800, 0.1],
    [100800, 0.12],
    [211400, 0.22],
    [403550, 0.24],
    [512450, 0.32],
    [768700, 0.35],
    [Infinity, 0.37],
  ],
  hoh: [
    [17700, 0.1],
    [67450, 0.12],
    [105700, 0.22],
    [201750, 0.24],
    [256200, 0.32],
    [640600, 0.35],
    [Infinity, 0.37],
  ],
};
export const standardDeduction2026 = {
  single: 16100,
  married: 32200,
  hoh: 24150,
};
export const additionalMedicareThreshold2026 = {
  single: 200000,
  married: 250000,
  hoh: 200000,
};
export const SOCIAL_SECURITY_WAGE_BASE_2026 = 184500;
