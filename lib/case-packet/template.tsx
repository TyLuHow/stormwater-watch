/**
 * React-PDF Template for Case Packets
 * Attorney-ready PDF generation for violation events
 */

import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { CasePacketData } from "./types"
import { format } from "date-fns"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2pt solid #333",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "40%",
    fontWeight: "bold",
  },
  value: {
    width: "60%",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1pt solid #333",
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottom: "0.5pt solid #ddd",
  },
  tableCol: {
    width: "20%",
    fontSize: 9,
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff3cd",
    border: "1pt solid #ffc107",
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
  },
  map: {
    width: "100%",
    height: 200,
    marginTop: 10,
    marginBottom: 10,
  },
  highlight: {
    backgroundColor: "#ffeb3b",
    padding: 2,
  },
})

export const CasePacketDocument: React.FC<{ data: CasePacketData }> = ({ data }) => {
  const { facility, violation, samples } = data

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>STORMWATER VIOLATION CASE PACKET</Text>
          <Text style={styles.subtitle}>Generated: {format(data.generatedAt, "PPpp")}</Text>
          <Text style={styles.subtitle}>Facility: {facility.name}</Text>
        </View>

        {/* Facility Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. FACILITY INFORMATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Facility Name:</Text>
            <Text style={styles.value}>{facility.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Permit ID:</Text>
            <Text style={styles.value}>{facility.permitId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>
              {facility.lat.toFixed(6)}, {facility.lon.toFixed(6)}
            </Text>
          </View>
          {facility.county && (
            <View style={styles.row}>
              <Text style={styles.label}>County:</Text>
              <Text style={styles.value}>{facility.county}</Text>
            </View>
          )}
          {facility.watershedHuc12 && (
            <View style={styles.row}>
              <Text style={styles.label}>Watershed (HUC12):</Text>
              <Text style={styles.value}>{facility.watershedHuc12}</Text>
            </View>
          )}
          {facility.ms4 && (
            <View style={styles.row}>
              <Text style={styles.label}>MS4 Jurisdiction:</Text>
              <Text style={styles.value}>{facility.ms4}</Text>
            </View>
          )}
          {facility.isInDAC && (
            <View style={styles.row}>
              <Text style={styles.label}>Environmental Justice:</Text>
              <Text style={[styles.value, styles.highlight]}>
                ✓ Located in CalEnviroScreen Disadvantaged Community
              </Text>
            </View>
          )}
        </View>

        {/* Violation Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. VIOLATION SUMMARY</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Pollutant:</Text>
            <Text style={styles.value}>{violation.pollutant}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reporting Year:</Text>
            <Text style={styles.value}>{violation.reportingYear}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>First Exceedance:</Text>
            <Text style={styles.value}>{format(violation.firstDate, "PP")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last Exceedance:</Text>
            <Text style={styles.value}>{format(violation.lastDate, "PP")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Number of Exceedances:</Text>
            <Text style={[styles.value, violation.count > 2 ? styles.highlight : {}]}>
              {violation.count} {violation.count > 2 ? "(Repeat Offender)" : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Maximum Exceedance Ratio:</Text>
            <Text style={[styles.value, Number(violation.maxRatio) > 2 ? styles.highlight : {}]}>
              {Number(violation.maxRatio).toFixed(2)}x benchmark
            </Text>
          </View>
          {violation.impairedWater && (
            <View style={styles.row}>
              <Text style={styles.label}>Receiving Water:</Text>
              <Text style={[styles.value, styles.highlight]}>
                ⚠ Discharges to impaired water body
              </Text>
            </View>
          )}
        </View>

        {/* Sample Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. SAMPLE DATA</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, { width: "20%" }]}>Date</Text>
              <Text style={[styles.tableCol, { width: "20%" }]}>Value</Text>
              <Text style={[styles.tableCol, { width: "15%" }]}>Unit</Text>
              <Text style={[styles.tableCol, { width: "20%" }]}>Benchmark</Text>
              <Text style={[styles.tableCol, { width: "25%" }]}>Ratio</Text>
            </View>
            {samples.slice(0, 20).map((sample, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: "20%" }]}>
                  {format(sample.sampleDate, "PP")}
                </Text>
                <Text style={[styles.tableCol, { width: "20%" }]}>{sample.value.toFixed(2)}</Text>
                <Text style={[styles.tableCol, { width: "15%" }]}>{sample.unit}</Text>
                <Text style={[styles.tableCol, { width: "20%" }]}>{sample.benchmark.toFixed(2)}</Text>
                <Text style={[styles.tableCol, { width: "25%" }]}>
                  {sample.exceedanceRatio ? `${sample.exceedanceRatio.toFixed(2)}x` : "N/A"}
                </Text>
              </View>
            ))}
          </View>
          {samples.length > 20 && (
            <Text style={{ marginTop: 5, fontSize: 9, fontStyle: "italic" }}>
              Showing first 20 of {samples.length} samples
            </Text>
          )}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>⚠️ ATTORNEY REVIEW REQUIRED</Text>
          <Text>
            This case packet is generated from public regulatory data for preliminary review
            purposes only. Attorney review and verification is required before external use or
            filing. Data provenance and accuracy should be independently confirmed.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Stormwater Watch • Case Packet ID: {violation.id} • Page 1
        </Text>
      </Page>

      {/* Second page - Additional context */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>4. PROVENANCE & DATA QUALITY</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Data Source:</Text>
            <Text style={styles.value}>{samples[0]?.source || "Industrial Stormwater Database"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data Retrieved:</Text>
            <Text style={styles.value}>{format(facility.createdAt, "PP")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Document Created:</Text>
            <Text style={styles.value}>{format(data.generatedAt, "PPpp")}</Text>
          </View>
        </View>

        {data.precipitation && data.precipitation.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. PRECIPITATION CONTEXT</Text>
            <Text style={{ marginBottom: 8, fontSize: 9, fontStyle: "italic" }}>
              Rainfall data for sample dates (source: NOAA)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, { width: "50%" }]}>Date</Text>
                <Text style={[styles.tableCol, { width: "50%" }]}>Precipitation (mm)</Text>
              </View>
              {data.precipitation.map((precip, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCol, { width: "50%" }]}>
                    {format(precip.date, "PP")}
                  </Text>
                  <Text style={[styles.tableCol, { width: "50%" }]}>
                    {precip.precipitationMM !== null ? precip.precipitationMM.toFixed(1) : "N/A"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. NEXT STEPS FOR LEGAL REVIEW</Text>
          <Text style={{ marginBottom: 5 }}>☐ Verify facility permit status with State Water Board</Text>
          <Text style={{ marginBottom: 5 }}>☐ Confirm exceedance calculations against raw data</Text>
          <Text style={{ marginBottom: 5 }}>☐ Review precipitation records for sampling conditions</Text>
          <Text style={{ marginBottom: 5 }}>☐ Check for prior enforcement actions or settlements</Text>
          <Text style={{ marginBottom: 5 }}>☐ Assess environmental justice implications</Text>
          <Text style={{ marginBottom: 5 }}>☐ Determine applicable statutory authority and deadlines</Text>
        </View>

        <Text style={styles.footer}>
          Stormwater Watch • Case Packet ID: {violation.id} • Page 2
        </Text>
      </Page>
    </Document>
  )
}




