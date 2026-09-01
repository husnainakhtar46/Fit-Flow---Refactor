import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { MeasurementSection } from './MeasurementSection';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        textDecoration: 'underline',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        padding: 5,
        marginBottom: 10,
        textDecoration: 'underline',
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '12.5%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#e4e4e4',
        padding: 5,
        fontWeight: 'bold',
        fontSize: 9,
    },
    tableCol: {
        width: '12.5%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
        fontSize: 9,
    },
    tableColWide: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    oot: {
        color: 'red',
        fontWeight: 'bold',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoItem: {
        width: '45%',
        marginBottom: 15,
    },
    image: {
        width: '100%',
        height: 150,
        objectFit: 'contain',
    },
    caption: {
        marginTop: 5,
        textAlign: 'center',
        fontSize: 8,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    summaryItem: {
        width: '33%',
        marginBottom: 5,
    },
    bold: {
        fontWeight: 'bold',
    },
    pass: {
        color: 'green',
        fontWeight: 'bold',
    },
    fail: {
        color: 'red',
        fontWeight: 'bold',
    }
});

interface PDFReportProps {
    data: any;
    defects?: any[];
    images?: any[];
}

export const PDFReport = ({ data, defects = [], images = [] }: PDFReportProps) => {
    const isOutOfTolerance = (value: any, spec: any, tol: any) => {
        if (!value || value === '') return false;
        const numVal = parseFloat(value);
        const numSpec = parseFloat(spec);
        const numTol = parseFloat(tol);
        if (isNaN(numVal) || isNaN(numSpec) || isNaN(numTol)) return false;
        return Math.abs(numVal - numSpec) > numTol;
    };

    const maxCrit = data.max_allowed_critical ?? data.max_critical_allowed ?? 0;
    const foundCrit = data.critical_found ?? data.found_critical ?? (defects.filter((d: any) => (d.type || d.severity) === 'critical').reduce((acc: number, d: any) => acc + (Number(d.count) || 0), 0));
    const maxMaj = data.max_allowed_major ?? data.max_major_allowed ?? 0;
    const foundMaj = data.major_found ?? data.found_major ?? (defects.filter((d: any) => (d.type || d.severity) === 'major').reduce((acc: number, d: any) => acc + (Number(d.count) || 0), 0));
    const maxMin = data.max_allowed_minor ?? data.max_minor_allowed ?? 0;
    const foundMin = data.minor_found ?? data.found_minor ?? (defects.filter((d: any) => (d.type || d.severity) === 'minor').reduce((acc: number, d: any) => acc + (Number(d.count) || 0), 0));
    const result = data.result || data.decision || ((foundCrit > maxCrit || foundMaj > maxMaj || foundMin > maxMin) ? 'Fail' : 'Pass');

    return (
        <Document>
            {/* Page 1: Summary */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>FINAL INSPECTION REPORT</Text>

                {/* Result Badge */}
                <Text style={{ textAlign: 'right', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                    RESULT: <Text style={result === 'Pass' || result === 'Accepted' || result === 'Passed' ? styles.pass : styles.fail}>{result?.toUpperCase() || 'PENDING'}</Text>
                </Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. General Information</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColHeader, { width: '16%' }]}><Text>Customer:</Text></View>
                            <View style={[styles.tableCol, { width: '36%' }]}><Text>{data.customer_name || data.customer?.name || 'N/A'}</Text></View>
                            <View style={[styles.tableColHeader, { width: '18%' }]}><Text>Inspection Date:</Text></View>
                            <View style={[styles.tableCol, { width: '30%' }]}><Text>{data.inspection_date || (data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A')}</Text></View>
                        </View>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColHeader, { width: '16%' }]}><Text>AQL Level:</Text></View>
                            <View style={[styles.tableCol, { width: '36%' }]}><Text>{data.aql_level || data.aql_standard || '2.5'}</Text></View>
                            <View style={[styles.tableColHeader, { width: '18%' }]}><Text>Order / PO:</Text></View>
                            <View style={[styles.tableCol, { width: '30%' }]}><Text>{data.po_number || data.order_no || '-'}</Text></View>
                        </View>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColHeader, { width: '16%' }]}><Text>Factory:</Text></View>
                            <View style={[styles.tableCol, { width: '36%' }]}><Text>{data.factory || data.factory_name || 'N/A'}</Text></View>
                            <View style={[styles.tableColHeader, { width: '18%' }]}><Text>Style:</Text></View>
                            <View style={[styles.tableCol, { width: '30%' }]}><Text>{data.style || data.style_no || '-'}</Text></View>
                        </View>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColHeader, { width: '16%' }]}><Text>Color:</Text></View>
                            <View style={[styles.tableCol, { width: '36%' }]}><Text>{data.color || '-'}</Text></View>
                            <View style={[styles.tableColHeader, { width: '18%' }]}><Text>Stage / Type:</Text></View>
                            <View style={[styles.tableCol, { width: '30%' }]}><Text>{data.inspection_type || data.inspection_attempt || 'Final'}</Text></View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. AQL Result Summary</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColHeader, { width: '40%' }]}><Text>Defect Type</Text></View>
                            <View style={[styles.tableColHeader, { width: '20%' }]}><Text>Allowed</Text></View>
                            <View style={[styles.tableColHeader, { width: '20%' }]}><Text>Found</Text></View>
                            <View style={[styles.tableColHeader, { width: '20%' }]}><Text>Status</Text></View>
                        </View>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCol, { width: '40%' }]}><Text>Critical</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{maxCrit}</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{foundCrit}</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{foundCrit <= maxCrit ? 'Pass' : 'Fail'}</Text></View>
                        </View>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCol, { width: '40%' }]}><Text>Major</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{maxMaj}</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{foundMaj}</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{foundMaj <= maxMaj ? 'Pass' : 'Fail'}</Text></View>
                        </View>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCol, { width: '40%' }]}><Text>Minor</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{maxMin}</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{foundMin}</Text></View>
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>{foundMin <= maxMin ? 'Pass' : 'Fail'}</Text></View>
                        </View>
                    </View>
                </View>
            </Page>

            {/* Page 2: Measurements (Color & Size-wise) */}
            <MeasurementSection
                measurements={data.measurements}
                styles={styles}
                isOutOfTolerance={isOutOfTolerance}
            />

            {/* Page 3: Defects */}
            {defects && defects.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <Text style={styles.sectionTitle}>4. Defect Findings</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColWide, { backgroundColor: '#e4e4e4', width: '60%' }]}><Text>Description</Text></View>
                            <View style={[styles.tableColHeader, { width: '20%' }]}><Text>Severity</Text></View>
                            <View style={[styles.tableColHeader, { width: '20%' }]}><Text>Count</Text></View>
                        </View>
                        {defects.map((d: any, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={[styles.tableCol, { width: '60%' }]}><Text>{d.description}</Text></View>
                                <View style={[styles.tableCol, { width: '20%' }]}><Text>{d.type || d.severity}</Text></View>
                                <View style={[styles.tableCol, { width: '20%' }]}><Text>{d.count}</Text></View>
                            </View>
                        ))}
                    </View>
                </Page>
            )}

            {/* Page 4: Photos */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>5. Inspection Photos</Text>
                {images && images.length > 0 ? (
                    <View>
                        <Text style={{ marginBottom: 10 }}>Total Photos Attached: {images.length}</Text>
                        {images.map((img: any, i: number) => (
                            <View key={i} style={{ marginBottom: 5, padding: 5, backgroundColor: '#f5f5f5' }}>
                                <Text>📷 Photo {i + 1}: {img.caption || 'No caption'} ({img.category || 'General'})</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text>No photos attached.</Text>
                )}
            </Page>
        </Document>
    );
};

export default PDFReport;
