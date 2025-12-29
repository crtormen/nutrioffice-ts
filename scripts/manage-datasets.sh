#!/bin/bash

# Dataset management script for Firebase emulators
# Helps save, load, and manage different emulator data snapshots

set -e

DATASETS_DIR="./datasets"
CURRENT_DATA="./emulator-data"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
  echo "Firebase Emulator Dataset Manager"
  echo ""
  echo "Usage: $0 <command> [name]"
  echo ""
  echo "Commands:"
  echo "  save <name>     Save current emulator data as named dataset"
  echo "  load <name>     Load a saved dataset into emulator"
  echo "  list            List all saved datasets"
  echo "  delete <name>   Delete a saved dataset"
  echo "  clean           Delete current emulator data (start fresh)"
  echo ""
  echo "Examples:"
  echo "  $0 save my-test-scenario"
  echo "  $0 load my-test-scenario"
  echo "  $0 list"
}

save_dataset() {
  local name=$1
  if [ -z "$name" ]; then
    echo "Error: Dataset name required"
    echo "Usage: $0 save <name>"
    exit 1
  fi

  if [ ! -d "$CURRENT_DATA" ]; then
    echo "Error: No emulator data found at $CURRENT_DATA"
    exit 1
  fi

  mkdir -p "$DATASETS_DIR"
  local target="$DATASETS_DIR/$name"

  if [ -d "$target" ]; then
    echo -e "${YELLOW}Warning: Dataset '$name' already exists${NC}"
    read -p "Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Cancelled"
      exit 0
    fi
    rm -rf "$target"
  fi

  cp -r "$CURRENT_DATA" "$target"
  echo -e "${GREEN}✅ Dataset '$name' saved${NC}"
  echo "Location: $target"
}

load_dataset() {
  local name=$1
  if [ -z "$name" ]; then
    echo "Error: Dataset name required"
    echo "Usage: $0 load <name>"
    exit 1
  fi

  local source="$DATASETS_DIR/$name"
  if [ ! -d "$source" ]; then
    echo "Error: Dataset '$name' not found"
    echo "Available datasets:"
    list_datasets
    exit 1
  fi

  # Backup current data if it exists
  if [ -d "$CURRENT_DATA" ]; then
    local backup="./emulator-data-backup-$(date +%Y%m%d-%H%M%S)"
    echo -e "${BLUE}📦 Backing up current data to $backup${NC}"
    cp -r "$CURRENT_DATA" "$backup"
  fi

  # Load dataset
  rm -rf "$CURRENT_DATA"
  cp -r "$source" "$CURRENT_DATA"
  echo -e "${GREEN}✅ Dataset '$name' loaded${NC}"
  echo "Start emulators with: npm run emulate"
}

list_datasets() {
  if [ ! -d "$DATASETS_DIR" ] || [ -z "$(ls -A $DATASETS_DIR 2>/dev/null)" ]; then
    echo "No saved datasets found"
    return
  fi

  echo -e "${BLUE}Saved datasets:${NC}"
  for dataset in "$DATASETS_DIR"/*; do
    if [ -d "$dataset" ]; then
      local name=$(basename "$dataset")
      local size=$(du -sh "$dataset" | cut -f1)
      local date=$(stat -c %y "$dataset" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm -t %Y-%m-%d "$dataset")
      echo "  • $name ($size, modified: $date)"
    fi
  done
}

delete_dataset() {
  local name=$1
  if [ -z "$name" ]; then
    echo "Error: Dataset name required"
    echo "Usage: $0 delete <name>"
    exit 1
  fi

  local target="$DATASETS_DIR/$name"
  if [ ! -d "$target" ]; then
    echo "Error: Dataset '$name' not found"
    exit 1
  fi

  read -p "Delete dataset '$name'? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$target"
    echo -e "${GREEN}✅ Dataset '$name' deleted${NC}"
  else
    echo "Cancelled"
  fi
}

clean_current() {
  if [ ! -d "$CURRENT_DATA" ]; then
    echo "No current emulator data found"
    exit 0
  fi

  echo -e "${YELLOW}Warning: This will delete all current emulator data${NC}"
  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$CURRENT_DATA"
    echo -e "${GREEN}✅ Emulator data cleared${NC}"
    echo "Start emulators to create fresh data: npm run emulate"
  else
    echo "Cancelled"
  fi
}

# Main command routing
case "${1:-}" in
  save)
    save_dataset "$2"
    ;;
  load)
    load_dataset "$2"
    ;;
  list)
    list_datasets
    ;;
  delete)
    delete_dataset "$2"
    ;;
  clean)
    clean_current
    ;;
  help|--help|-h|"")
    show_help
    ;;
  *)
    echo "Unknown command: $1"
    echo ""
    show_help
    exit 1
    ;;
esac
