#!/bin/bash
# DearMe Database Backup Script
# Usage: ./scripts/backup_db.sh [options]
#
# Options:
#   -d, --dir DIR      Backup directory (default: ./backups)
#   -r, --retain DAYS  Retention days (default: 30)
#   -c, --compose FILE Docker compose file (default: docker-compose.prod.yml)
#   -h, --help         Show this help

set -euo pipefail

# Default values
BACKUP_DIR="./backups"
RETENTION_DAYS=30
COMPOSE_FILE="docker-compose.prod.yml"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="dearme"
DB_USER="dearme"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    sed -n '2,9p' "$0" | sed 's/^# //'
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -r|--retain)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -c|--compose)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# Create backup directory
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

log_info "Starting database backup..."
log_info "Backup file: $BACKUP_FILE"

# Check if postgres container is running
if ! docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
    log_error "PostgreSQL container is not running!"
    exit 1
fi

# Create backup using pg_dump
log_info "Creating backup..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify backup
if [[ -f "$BACKUP_FILE" ]] && [[ $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null) -gt 0 ]]; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    log_info "Backup created successfully! Size: $BACKUP_SIZE"
else
    log_error "Backup failed! File is empty or not created."
    exit 1
fi

# Clean up old backups
log_info "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
if [[ $DELETED_COUNT -gt 0 ]]; then
    log_info "Deleted $DELETED_COUNT old backup(s)"
else
    log_info "No old backups to delete"
fi

# List recent backups
log_info "Recent backups:"
ls -lht "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | head -5 || log_warn "No backups found"

log_info "Backup complete!"
