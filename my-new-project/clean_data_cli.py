#!/usr/bin/env python3
"""
CLI wrapper for data cleaning that outputs cleaned file path
This script is designed to be called from TypeScript/JavaScript
"""

import sys
import os
from data_cleaner import DataCleaner

def main():
    if len(sys.argv) < 2:
        print("Error: No input file provided", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"Error: File not found: {input_file}", file=sys.stderr)
        sys.exit(1)

    # Determine output path
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
    else:
        # Default: add _cleaned suffix
        base, ext = os.path.splitext(input_file)
        output_file = f"{base}_cleaned{ext}"

    try:
        # Run the cleaner
        cleaner = DataCleaner(input_file)
        cleaner.clean_all()

        # Save cleaned data
        actual_output = cleaner.save_cleaned_data(output_file)

        # Print report to stderr so stdout only has the path
        print(file=sys.stderr)
        cleaner.print_report()

        # Output the cleaned file path to stdout for parsing
        print(actual_output)

        sys.exit(0)

    except Exception as e:
        print(f"Error during cleaning: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
