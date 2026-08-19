// AQL Calculation utilities for Final Inspection based on ISO 2859-1 standards

export const AQL_STANDARDS = {
  strict: { critical: 0.0, major: 1.5, minor: 2.5 },
  standard: { critical: 0.0, major: 2.5, minor: 4.0 },
};

export interface AQLLimits {
  critical: { maxAllowed: number };
  major: { maxAllowed: number };
  minor: { maxAllowed: number };
}

export function calculateSampleSize(orderQty: number): { sampleSize: number; codeLetter: string } {
  if (orderQty <= 8) return { sampleSize: 2, codeLetter: 'A' };
  if (orderQty <= 15) return { sampleSize: 3, codeLetter: 'B' };
  if (orderQty <= 25) return { sampleSize: 5, codeLetter: 'C' };
  if (orderQty <= 50) return { sampleSize: 8, codeLetter: 'D' };
  if (orderQty <= 90) return { sampleSize: 13, codeLetter: 'E' };
  if (orderQty <= 150) return { sampleSize: 20, codeLetter: 'F' };
  if (orderQty <= 280) return { sampleSize: 32, codeLetter: 'G' };
  if (orderQty <= 500) return { sampleSize: 50, codeLetter: 'H' };
  if (orderQty <= 1200) return { sampleSize: 80, codeLetter: 'J' };
  if (orderQty <= 3200) return { sampleSize: 125, codeLetter: 'K' };
  if (orderQty <= 10000) return { sampleSize: 200, codeLetter: 'L' };
  if (orderQty <= 35000) return { sampleSize: 315, codeLetter: 'M' };
  if (orderQty <= 150000) return { sampleSize: 500, codeLetter: 'N' };
  if (orderQty <= 500000) return { sampleSize: 800, codeLetter: 'P' };
  return { sampleSize: 1250, codeLetter: 'Q' };
}

export function getAQLLimitValue(sampleSize: number, aqlLevel: string | number): number {
  const levelStr = String(aqlLevel);
  const aqlTable: Record<string, number> = {
    '2-1.0': 0, '2-1.5': 0, '2-2.5': 0, '2-4.0': 0, '2-6.5': 0,
    '3-1.0': 0, '3-1.5': 0, '3-2.5': 0, '3-4.0': 0, '3-6.5': 0,
    '5-1.0': 0, '5-1.5': 0, '5-2.5': 0, '5-4.0': 0, '5-6.5': 1,
    '8-1.0': 0, '8-1.5': 0, '8-2.5': 0, '8-4.0': 1, '8-6.5': 1,
    '13-1.0': 0, '13-1.5': 0, '13-2.5': 1, '13-4.0': 1, '13-6.5': 2,
    '20-1.0': 0, '20-1.5': 1, '20-2.5': 1, '20-4.0': 2, '20-6.5': 3,
    '32-1.0': 1, '32-1.5': 1, '32-2.5': 2, '32-4.0': 3, '32-6.5': 5,
    '50-1.0': 1, '50-1.5': 2, '50-2.5': 3, '50-4.0': 5, '50-6.5': 7,
    '80-1.0': 2, '80-1.5': 3, '80-2.5': 5, '80-4.0': 7, '80-6.5': 10,
    '125-1.0': 3, '125-1.5': 5, '125-2.5': 7, '125-4.0': 10, '125-6.5': 14,
    '200-1.0': 5, '200-1.5': 7, '200-2.5': 10, '200-4.0': 14, '200-6.5': 21,
    '315-1.0': 7, '315-1.5': 10, '315-2.5': 14, '315-4.0': 21, '315-6.5': 21,
    '500-1.0': 10, '500-1.5': 14, '500-2.5': 21, '500-4.0': 21, '500-6.5': 21,
    '800-1.0': 14, '800-1.5': 21, '800-2.5': 21, '800-4.0': 21, '800-6.5': 21,
    '1250-1.0': 21, '1250-1.5': 21, '1250-2.5': 21, '1250-4.0': 21, '1250-6.5': 21,
  };

  const key = `${sampleSize}-${levelStr}`;
  if (key in aqlTable) return aqlTable[key];
  return 0;
}

export function calculateDefectLimits(
  sampleSize: number,
  majorLevel: string | number = '2.5'
): AQLLimits {
  return {
    critical: { maxAllowed: 0 },
    major: { maxAllowed: getAQLLimitValue(sampleSize, majorLevel) },
    minor: { maxAllowed: getAQLLimitValue(sampleSize, '4.0') },
  };
}

export function calculateVerdict(
  foundCritical: number,
  foundMajor: number,
  foundMinor: number,
  maxCritical: number,
  maxMajor: number,
  maxMinor: number
): 'Pass' | 'Fail' | 'Pending' {
  if (
    foundCritical > maxCritical ||
    foundMajor > maxMajor ||
    foundMinor > maxMinor
  ) {
    return 'Fail';
  }
  return 'Pass';
}
