import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    paddingTop: 30,
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#000',
  },
  statusValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginLeft: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  infoColumn: {
    width: '48%',
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    width: 80,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    flex: 1,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
  },
  tableColHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    padding: 3,
    textAlign: 'left',
  },
  tableCol: {
    fontSize: 8,
    padding: 3,
    textAlign: 'left',
  },
  colPom: { width: '35%' },
  colTol: { width: '10%' },
  colStd: { width: '10%' },
  colSample: { width: '10%' },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 5,
  },
  commentBlock: {
    marginBottom: 5,
  },
  commentLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  qaComment: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#000099',
    marginLeft: 15,
  },
  fabricRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center',
  },
  fabricItem: {
    flexDirection: 'row',
    marginRight: 40,
    alignItems: 'center',
  },
  accTable: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  accHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
  },
  accRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
  },
  accRowLast: {
    flexDirection: 'row',
    borderBottomWidth: 0,
  },
  accHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderStyle: 'solid',
  },
  accCell: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderStyle: 'solid',
  },
  accCellLast: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 0,
  },
  customerAddressed: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  finalRemarksLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
  },
  finalRemarksText: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    marginTop: 2,
  },
  bold: { fontFamily: 'Helvetica-Bold' },
  red: { color: '#FF0000' },
  green: { color: '#008000' },
  orange: { color: '#FF8000' },
});

export const getDecisionColor = (d: string) => {
  if (!d) return styles.statusValue;
  const lower = d.toLowerCase();
  if (lower === 'rejected') return styles.red;
  if (lower === 'accepted') return styles.green;
  if (lower === 'represent') return styles.orange;
  return styles.statusValue;
};

export const isOutOfTolerance = (sampleVal: any, std: any, tol: any) => {
  const s = parseFloat(sampleVal);
  const target = parseFloat(std);
  const tolerance = parseFloat(tol);
  if (isNaN(s) || isNaN(target) || isNaN(tolerance)) return false;
  return Math.abs(s - target) > tolerance;
};
