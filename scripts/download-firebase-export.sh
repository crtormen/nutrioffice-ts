#!/bin/bash

# Download Firestore export from Google Cloud Storage
# This script helps download production Firestore data to use in local emulators

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gsutil is available
if ! command -v gsutil &> /dev/null; then
    echo -e "${RED}Error: gsutil not found${NC}"
    echo "Please install Google Cloud SDK and run: source ~/.bashrc"
    echo "Or source the gcloud path: source ~/google-cloud-sdk/path.bash.inc"
    exit 1
fi

echo -e "${BLUE}Firebase Export Downloader${NC}"
echo ""

# Get project ID
if [ -z "$1" ]; then
    echo "Usage: $0 <project-id> [export-path]"
    echo ""
    echo "Example: $0 my-project-id gs://my-bucket/2025-01-29_export"
    echo ""
    echo "To find your exports:"
    echo "  1. List buckets: gsutil ls"
    echo "  2. List exports: gsutil ls gs://your-bucket-name/"
    exit 1
fi

PROJECT_ID="$1"
EXPORT_PATH="${2:-}"
DOWNLOAD_DIR="./production-export"

echo -e "${BLUE}Project: $PROJECT_ID${NC}"
echo ""

# If no export path provided, try to find recent exports
if [ -z "$EXPORT_PATH" ]; then
    echo "Searching for exports in project buckets..."

    # Try common bucket names
    BUCKET_NAMES=(
        "gs://${PROJECT_ID}-firestore-backups"
        "gs://${PROJECT_ID}.appspot.com"
        "gs://${PROJECT_ID}"
    )

    for bucket in "${BUCKET_NAMES[@]}"; do
        if gsutil ls "$bucket" &> /dev/null; then
            echo -e "${GREEN}Found bucket: $bucket${NC}"
            echo "Recent exports:"
            gsutil ls "$bucket" | tail -5
            echo ""
            read -p "Enter the full export path (gs://...): " EXPORT_PATH
            break
        fi
    done

    if [ -z "$EXPORT_PATH" ]; then
        echo -e "${YELLOW}No automatic bucket found. Please provide the export path.${NC}"
        echo "List your buckets with: gsutil ls"
        exit 1
    fi
fi

# Validate export path
if [[ ! $EXPORT_PATH == gs://* ]]; then
    echo -e "${RED}Error: Export path must start with gs://${NC}"
    echo "Example: gs://my-bucket/2025-01-29_export"
    exit 1
fi

echo -e "${BLUE}Downloading from: $EXPORT_PATH${NC}"
echo -e "${BLUE}Downloading to: $DOWNLOAD_DIR${NC}"
echo ""

# Create download directory
mkdir -p "$DOWNLOAD_DIR"

# Check if download dir has existing data
if [ -d "$DOWNLOAD_DIR" ] && [ "$(ls -A $DOWNLOAD_DIR)" ]; then
    echo -e "${YELLOW}Warning: $DOWNLOAD_DIR already contains files${NC}"
    read -p "Delete existing files? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "${DOWNLOAD_DIR:?}"/*
    else
        echo "Cancelled"
        exit 0
    fi
fi

# Download the export
echo -e "${BLUE}Downloading... (this may take a while)${NC}"
gsutil -m cp -r "$EXPORT_PATH"/* "$DOWNLOAD_DIR/"

echo ""
echo -e "${GREEN}✅ Download complete!${NC}"
echo ""
echo "Export downloaded to: $DOWNLOAD_DIR"
echo ""
echo "Next steps:"
echo "  1. Import to emulator:"
echo "     ./scripts/import-production-data.sh $DOWNLOAD_DIR"
echo ""
echo "  2. Or save as a named dataset:"
echo "     ./scripts/manage-datasets.sh save production-$(date +%Y%m%d)"
echo "     ./scripts/import-production-data.sh $DOWNLOAD_DIR"
echo ""
echo "  3. Start emulators:"
echo "     npm run emulate"
