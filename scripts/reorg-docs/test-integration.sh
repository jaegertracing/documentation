#!/bin/bash

# Exit on error
set -e

# Create tmp/test-data directory if it doesn't exist
mkdir -p tmp/test-data

# Run the integration test
npm test -- tests/FileMover/integration.test.ts

# Clean up test data only, preserve tmp folder
rm -rf tmp/test-data