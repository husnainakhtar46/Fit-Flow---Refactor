'use client';

import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles, getDecisionColor, isOutOfTolerance } from './evaluationPDFStyles';

interface EvaluationPDFReportProps {
  data: any;
  images: any[];
}

export const EvaluationPDFReport = ({ data, images }: EvaluationPDFReportProps) => {
  const samplesCount = data.measurements?.[0]?.samples?.length || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>SAMPLE EVALUATION REPORT</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>STATUS:</Text>
            <Text style={[styles.statusValue, getDecisionColor(data.decision)]}>
              {(data.decision || 'PENDING').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* General Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Style:</Text>
              <Text style={[styles.infoValue, styles.bold]}>{data.style}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color:</Text>
              <Text style={styles.infoValue}>{data.color || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PO #:</Text>
              <Text style={styles.infoValue}>{data.po_number || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>
                {data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stage:</Text>
              <Text style={styles.infoValue}>{data.stage || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{data.customer_name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Factory:</Text>
              <Text style={styles.infoValue}>{data.factory_name || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Measurements Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, styles.colPom]}>POM</Text>
            <Text style={[styles.tableColHeader, styles.colTol]}>Tol</Text>
            <Text style={[styles.tableColHeader, styles.colStd]}>Std</Text>
            {Array.from({ length: samplesCount }).map((_, i) => (
              <Text key={i} style={[styles.tableColHeader, styles.colSample]}>
                S{i + 1}
              </Text>
            ))}
          </View>

          {data.measurements?.map((m: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.colPom]}>{m.pom_name}</Text>
              <Text style={[styles.tableCol, styles.colTol]}>{m.tol}</Text>
              <Text style={[styles.tableCol, styles.colStd]}>{m.std ?? '-'}</Text>
              {m.samples?.map((s: any, sIdx: number) => {
                const outOfTol = isOutOfTolerance(s.value, m.std, m.tol);
                return (
                  <Text
                    key={sIdx}
                    style={[
                      styles.tableCol,
                      styles.colSample,
                      outOfTol ? styles.red : {},
                    ]}
                  >
                    {s.value ?? '-'}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>

        {/* Fabric Check */}
        <View style={styles.fabricRow}>
          <Text style={styles.bold}>Fabric Check: </Text>
          <View style={styles.fabricItem}>
            <Text>Handfeel: </Text>
            <Text style={data.fabric_handfeel === 'Not OK' ? styles.red : styles.green}>
              {data.fabric_handfeel || 'OK'}
            </Text>
          </View>
          <View style={styles.fabricItem}>
            <Text>Pilling: </Text>
            <Text
              style={
                data.fabric_pilling === 'High'
                  ? styles.red
                  : data.fabric_pilling === 'Low'
                  ? styles.orange
                  : styles.green
              }
            >
              {data.fabric_pilling || 'None'}
            </Text>
          </View>
        </View>

        {/* Accessories Checklist */}
        {data.accessories_data && data.accessories_data.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.bold}>Accessories Checklist:</Text>
            <View style={styles.accTable}>
              <View style={styles.accHeaderRow}>
                <Text style={[styles.accHeaderCell, { width: '35%' }]}>Item</Text>
                <Text style={[styles.accHeaderCell, { width: '25%' }]}>Status</Text>
                <Text style={[styles.accHeaderCell, { width: '40%', borderRightWidth: 0 }]}>
                  Remarks
                </Text>
              </View>
              {data.accessories_data.map((acc: any, i: number) => {
                const isLast = i === data.accessories_data.length - 1;
                const status =
                  acc.status ||
                  (['Ok', 'Not Ok', 'Available', 'Improved'].includes(acc.comment || '')
                    ? acc.comment
                    : 'Ok');
                const remarks =
                  acc.status !== undefined
                    ? acc.comment || '-'
                    : (['Ok', 'Not Ok', 'Available', 'Improved'].includes(acc.comment || '')
                        ? '-'
                        : acc.comment || '-');

                const statusStyle =
                  status === 'Not Ok'
                    ? styles.red
                    : status === 'Available'
                    ? styles.orange
                    : styles.green;

                return (
                  <View key={i} style={isLast ? styles.accRowLast : styles.accRow}>
                    <Text style={[styles.accCell, { width: '35%' }]}>{acc.name}</Text>
                    <Text style={[styles.accCell, statusStyle, styles.bold, { width: '25%' }]}>
                      {status}
                    </Text>
                    <Text style={[styles.accCellLast, { width: '40%' }]}>{remarks}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Customer Comments Addressed */}
        <View style={styles.customerAddressed}>
          <Text style={styles.bold}>Customer Comments Addressed: </Text>
          <Text style={data.customer_comments_addressed ? styles.green : styles.orange}>
            {data.customer_comments_addressed ? '✓ YES' : '○ NO'}
          </Text>
        </View>

        {/* Comments Section */}
        <View style={{ marginTop: 5 }}>
          <Text style={styles.sectionTitle}>Evaluation Comments (Customer → QA):</Text>
          {[
            { label: 'Fit', cust: data.customer_fit_comments, qa: data.qa_fit_comments },
            { label: 'Workmanship', cust: data.customer_workmanship_comments, qa: data.qa_workmanship_comments },
            { label: 'Wash', cust: data.customer_wash_comments, qa: data.qa_wash_comments },
            { label: 'Fabric', cust: data.customer_fabric_comments, qa: data.qa_fabric_comments },
            { label: 'Accessories', cust: data.customer_accessories_comments, qa: data.qa_accessories_comments },
          ].map(
            (cat, i) =>
              (cat.cust || cat.qa) && (
                <View key={i} style={styles.commentBlock}>
                  <Text style={styles.commentLabel}>{cat.label}:</Text>
                  {cat.cust && (
                    <Text style={{ fontSize: 9, color: '#996600', marginLeft: 10 }}>
                      Customer: {cat.cust}
                    </Text>
                  )}
                  {cat.qa && <Text style={styles.qaComment}>QA: {cat.qa}</Text>}
                </View>
              )
          )}
        </View>

        {/* Final Remarks */}
        {data.remarks && (
          <View style={{ marginTop: 5 }}>
            <Text style={styles.finalRemarksLabel}>Final Remarks:</Text>
            <Text style={styles.finalRemarksText}>{data.remarks}</Text>
          </View>
        )}
      </Page>

      {/* Images Page (if any) */}
      {images && images.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.headerTitle}>INSPECTION IMAGES</Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: 15,
            }}
          >
            {images.map((img: any, idx: number) => {
              const src = typeof img.file === 'string' ? img.file : img.preview || img.image;
              if (!src) return null;
              return (
                <View key={idx} style={{ width: '48%', marginBottom: 15 }}>
                  <Image src={src} style={{ width: '100%', height: 180, objectFit: 'contain' }} />
                  <Text style={{ fontSize: 9, textAlign: 'center', marginTop: 4 }}>
                    {img.caption || `Image ${idx + 1}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </Page>
      )}
    </Document>
  );
};

export default EvaluationPDFReport;
