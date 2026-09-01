import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';

interface MeasurementSectionProps {
  measurements: any[];
  styles: any;
  isOutOfTolerance: (value: any, spec: any, tol: any) => boolean;
}

export const MeasurementSection: React.FC<MeasurementSectionProps> = ({
  measurements,
  styles,
  isOutOfTolerance,
}) => {
  if (!measurements || measurements.length === 0) return null;

  // Group measurements by color and size_name
  const groups: Record<string, Record<string, any[]>> = {};

  measurements.forEach((m) => {
    const color = (m.color || '').trim() || 'Default';
    const size = (m.size_name || '').trim() || 'All';
    if (!groups[color]) groups[color] = {};
    if (!groups[color][size]) groups[color][size] = [];
    groups[color][size].push(m);
  });

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>3. Measurement Report (Color & Size-wise)</Text>

      {Object.entries(groups).map(([color, sizes]) => (
        <View key={color} style={{ marginBottom: 12 }}>
          {Object.entries(sizes).map(([size, poms]) => {
            const sampleCount = 5;
            const sampleWidth = `${60 / sampleCount}%`;

            return (
              <View key={size} style={{ marginBottom: 10 }}>
                {/* Group Subtitle */}
                <View style={{ backgroundColor: '#f0f4f8', padding: 4, marginBottom: 4, borderRadius: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e3a8a' }}>
                    Color: {color} | Size: {size} ({poms.length} POMs)
                  </Text>
                </View>

                {/* Table */}
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableColWide, { backgroundColor: '#e4e4e4', width: '20%' }]}>
                      <Text>POM</Text>
                    </View>
                    <View style={[styles.tableColHeader, { width: '10%' }]}>
                      <Text>Spec</Text>
                    </View>
                    <View style={[styles.tableColHeader, { width: '10%' }]}>
                      <Text>Tol</Text>
                    </View>
                    {Array.from({ length: sampleCount }, (_, i) => (
                      <View key={i} style={[styles.tableColHeader, { width: sampleWidth }]}>
                        <Text>S{i + 1}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Table Body */}
                  {poms.map((m: any, i: number) => {
                    const samples = m.samples || [];

                    return (
                      <View key={i} style={styles.tableRow}>
                        <View style={[styles.tableColWide, { width: '20%' }]}>
                          <Text>{m.pom_name}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%' }]}>
                          <Text>{m.std ?? m.spec ?? '-'}</Text>
                        </View>
                        <View style={[styles.tableCol, { width: '10%' }]}>
                          <Text>{m.tol ?? '-'}</Text>
                        </View>
                        {Array.from({ length: sampleCount }, (_, idx) => {
                          const sample = samples.find(
                            (s: any) => s.index === idx + 1 || s.sample_index === idx + 1
                          ) || samples[idx];
                          const val = sample?.value;

                          return (
                            <View key={idx} style={[styles.tableCol, { width: sampleWidth }]}>
                              <Text style={isOutOfTolerance(val, m.std ?? m.spec, m.tol) ? styles.oot : {}}>
                                {val !== null && val !== undefined && val !== '' ? val : '-'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </Page>
  );
};
