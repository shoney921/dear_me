#!/bin/bash
# DearMe Database Restore Script
# Usage: ./scripts/restore_db.sh <backup_file>
#
# Options:
#   -c, --compose FILE Docker compose file (default: docker-compose.prod.yml)
#   -f, --force        Skip confirmation prompt
#   -h, --help         Show this help

set -euo pipefail

# Default values
COMPOSE_FILE="docker-compose.prod.yml"
FORCE=false
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
    sed -n '2,8p' "$0" | sed 's/^# //'
    exit 0
}

# Parse arguments
BACKUP_FILE=""
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--compose)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Validate backup file
if [[ -z "$BACKUP_FILE" ]]; then
    log_error "Backup file is required!"
    echo ""
    show_help
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_warn "============================================"
log_warn "WARNING: This will OVERWRITE the current database!"
log_warn "Backup file: $BACKUP_FILE"
log_warn "============================================"

# Confirmation prompt
if [[ "$FORCE" != true ]]; then
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Restore cancelled."
        exit 0
    fi
fi

# Check if postgres container is running
if ! docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
    log_error "PostgreSQL container is not running!"
    exit 1
fi

log_info "Starting database restore..."

# Drop and recreate database
log_info "Dropping existing database..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Enable pgvector extension
log_info "Enabling pgvector extension..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Restore from backup
log_info "Restoring from backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" "$DB_NAME"
else
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" "$DB_NAME" < "$BACKUP_FILE"
fi

log_info "Database restore complete!"
log_info "You may need to run migrations: docker-compose -f $COMPOSE_FILE exec backend alembic upgrade head"
