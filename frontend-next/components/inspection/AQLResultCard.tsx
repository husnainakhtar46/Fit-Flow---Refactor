'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerCalculations } from './types';

interface AQLResultCardProps {
  serverCalcs?: ServerCalculations;
  sampleSize?: number;
  limits?: any;
  critical?: number;
  major?: number;
  minor?: number;
  foundCritical?: number;
  foundMajor?: number;
  foundMinor?: number;
  verdict?: 'Pass' | 'Fail' | 'Pending';
}

export function AQLResultCard({
  serverCalcs,
  sampleSize,
  limits,
  critical,
  major,
  minor,
  foundCritical,
  foundMajor,
  foundMinor,
  verdict,
}: AQLResultCardProps) {
  const crit = critical ?? foundCritical ?? 0;
  const maj = major ?? foundMajor ?? 0;
  const min = minor ?? foundMinor ?? 0;
  const maxCrit = serverCalcs?.maxCritical ?? limits?.critical?.maxAllowed ?? 0;
  const maxMaj = serverCalcs?.maxMajor ?? limits?.major?.maxAllowed ?? 0;
  const maxMin = serverCalcs?.maxMinor ?? limits?.minor?.maxAllowed ?? 0;
  const result = serverCalcs?.result ?? verdict ?? (crit > maxCrit || maj > maxMaj || min > maxMin ? 'Fail' : 'Pass');

  return (
    <Card className="border-t-4 border-t-blue-600 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold">AQL Result Verification</CardTitle>
        <Badge
          className={
            result === 'Pass'
              ? 'bg-green-600 hover:bg-green-700'
              : result === 'Pending'
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-red-600 hover:bg-red-700'
          }
          style={{ fontSize: '1rem', padding: '0.4rem 1.2rem' }}
        >
          {result.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Critical Card */}
          <div
            className={`p-4 rounded-lg border-2 transition-all ${
              crit > maxCrit ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-xs text-gray-700">Critical</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">Max: {maxCrit}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{crit}</div>
            <p className={`text-xs mt-1 font-bold ${crit > maxCrit ? 'text-red-600' : 'text-green-600'}`}>
              {crit > maxCrit ? 'FAILED' : 'WITHIN LIMIT'}
            </p>
          </div>

          {/* Major Card */}
          <div
            className={`p-4 rounded-lg border-2 transition-all ${
              maj > maxMaj ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-xs text-gray-700">Major</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">Max: {maxMaj}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{maj}</div>
            <p className={`text-xs mt-1 font-bold ${maj > maxMaj ? 'text-red-600' : 'text-green-600'}`}>
              {maj > maxMaj ? 'FAILED' : 'WITHIN LIMIT'}
            </p>
          </div>

          {/* Minor Card */}
          <div
            className={`p-4 rounded-lg border-2 transition-all ${
              min > maxMin ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-xs text-gray-700">Minor</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">Max: {maxMin}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{min}</div>
            <p className={`text-xs mt-1 font-bold ${min > maxMin ? 'text-red-600' : 'text-green-600'}`}>
              {min > maxMin ? 'FAILED' : 'WITHIN LIMIT'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AQLResultCard;
