#!/usr/bin/env python3
"""Analyze eSMR CSV schema to understand data types, cardinality, and relationships."""

import csv
import sys
from collections import defaultdict
from datetime import datetime

def analyze_csv(filepath, max_rows=10000):
    """Analyze CSV file structure and data characteristics."""

    # Data structures for analysis
    columns = []
    sample_values = defaultdict(list)
    unique_counts = defaultdict(set)
    null_counts = defaultdict(int)
    data_types = defaultdict(set)
    total_rows = 0

    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames

        for i, row in enumerate(reader):
            if i >= max_rows:
                break
            total_rows += 1

            for col in columns:
                value = row[col]

                # Track null/empty values
                if not value or value.strip() == '' or value.upper() == 'NA' or value.upper() == 'NAN':
                    null_counts[col] += 1
                    continue

                # Collect sample values (first 5 unique)
                if len(sample_values[col]) < 5 and value not in sample_values[col]:
                    sample_values[col].append(value)

                # Track unique values (limited to 1000 to avoid memory issues)
                if len(unique_counts[col]) < 1000:
                    unique_counts[col].add(value)

                # Infer data type
                data_types[col].add(infer_type(value))

    # Generate report
    print("=" * 100)
    print(f"eSMR CSV SCHEMA ANALYSIS")
    print(f"File: {filepath}")
    print(f"Rows analyzed: {total_rows}")
    print(f"Columns: {len(columns)}")
    print("=" * 100)
    print()

    for col in columns:
        print(f"Column: {col}")
        print(f"  Data Type(s): {', '.join(sorted(data_types.get(col, {'unknown'})))}")
        print(f"  Nullable: {null_counts[col] > 0} ({null_counts[col]}/{total_rows} = {null_counts[col]/total_rows*100:.1f}% null)")

        unique_count = len(unique_counts[col])
        if unique_count >= 1000:
            cardinality = "HIGH (1000+)"
        elif unique_count >= 100:
            cardinality = f"MEDIUM ({unique_count})"
        elif unique_count >= 10:
            cardinality = f"LOW ({unique_count})"
        else:
            cardinality = f"VERY LOW ({unique_count})"
        print(f"  Cardinality: {cardinality}")

        print(f"  Sample Values: {sample_values.get(col, [])[:5]}")

        # Suggest entity/key type
        if 'id' in col.lower() or 'place_id' in col.lower():
            print(f"  Suggestion: FOREIGN KEY or IDENTIFIER")
        elif unique_count < 100 and unique_count > 1:
            print(f"  Suggestion: LOOKUP/REFERENCE TABLE")
        elif unique_count == total_rows - null_counts[col]:
            print(f"  Suggestion: POTENTIAL PRIMARY KEY")

        print()

    # Additional analysis
    print("=" * 100)
    print("ENTITY RELATIONSHIP ANALYSIS")
    print("=" * 100)
    print()

    # Facility/Location entities
    print("FACILITY/LOCATION IDENTIFIERS:")
    for col in ['facility_name', 'facility_place_id', 'location', 'location_place_id', 'receiving_water_body', 'latitude', 'longitude']:
        if col in columns:
            unique = len(unique_counts[col])
            print(f"  {col}: {unique} unique values")
    print()

    # Measurement entities
    print("MEASUREMENT/SAMPLE IDENTIFIERS:")
    for col in ['parameter', 'result', 'units', 'sampling_date', 'sampling_time', 'smr_document_id']:
        if col in columns:
            unique = len(unique_counts[col])
            print(f"  {col}: {unique} unique values")
    print()

    # Reference entities
    print("REFERENCE/LOOKUP CANDIDATES:")
    for col in ['region', 'location_place_type', 'analytical_method', 'qualifier', 'qa_codes']:
        if col in columns:
            unique = len(unique_counts[col])
            print(f"  {col}: {unique} unique values - {list(unique_counts[col])[:10]}")
    print()

def infer_type(value):
    """Infer data type from string value."""
    value = value.strip()

    # Try integer
    try:
        int(value)
        return 'integer'
    except (ValueError, TypeError):
        pass

    # Try float
    try:
        float(value)
        return 'decimal'
    except (ValueError, TypeError):
        pass

    # Try date (YYYY-MM-DD)
    try:
        if len(value) == 10 and value[4] == '-' and value[7] == '-':
            datetime.strptime(value, '%Y-%m-%d')
            return 'date'
    except (ValueError, TypeError):
        pass

    # Try time (HH:MM:SS)
    try:
        if ':' in value and len(value) <= 8:
            datetime.strptime(value, '%H:%M:%S')
            return 'time'
    except (ValueError, TypeError):
        pass

    # Default to string
    return 'string'

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'sample-2025.csv'
    analyze_csv(filepath)
