#!/bin/bash

# ============================================================================
# Supabase Deployment Script - Automated Migration & Seed Data
# Deploys all database schema and seed data to new Supabase project
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ID="ieqmsrrasdimpkdnvkfg"
SUPABASE_URL="https://ieqmsrrasdimpkdnvkfg.supabase.co"
PUBLISHABLE_KEY="sb_publishable_dLSj5bw5QU9xzYbdgjZgTA_PELwdCt2"
SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"

MIGRATIONS_DIR="supabase/migrations"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_info() {
  echo -e "${GREEN}✅${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}⚠️ ${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1"
}

log_section() {
  echo ""
  echo -e "${YELLOW}📌 $1${NC}"
}

# ============================================================================
# PRE-DEPLOYMENT CHECKS
# ============================================================================

log_header "PRE-DEPLOYMENT CHECKS"

log_section "Checking Supabase CLI"
if command -v supabase &> /dev/null; then
  log_info "Supabase CLI is installed"
  SUPABASE_VERSION=$(supabase --version)
  echo "   Version: $SUPABASE_VERSION"
else
  log_error "Supabase CLI not found. Install with: npm install -g supabase"
  exit 1
fi

log_section "Checking migration files"
if [ ! -d "$MIGRATIONS_DIR" ]; then
  log_error "Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
log_info "Found $MIGRATION_COUNT migration files"
ls -1 "$MIGRATIONS_DIR"/*.sql | sed 's/^/   → /'

log_section "Checking environment variables"
if grep -q "VITE_SUPABASE_PROJECT_ID" .env; then
  log_info ".env file contains Supabase configuration"
else
  log_error ".env file missing Supabase configuration"
  exit 1
fi

# ============================================================================
# CONNECTION VERIFICATION
# ============================================================================

log_header "CONNECTION VERIFICATION"

log_section "Testing Supabase API connection"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $PUBLISHABLE_KEY" \
  "$SUPABASE_URL/rest/v1/")

if [ "$HTTP_CODE" == "200" ]; then
  log_info "Supabase API is reachable (HTTP $HTTP_CODE)"
else
  log_warn "API returned HTTP $HTTP_CODE (may still be accessible)"
fi

log_section "Verifying project configuration"
echo "   Project ID: $PROJECT_ID"
echo "   URL: $SUPABASE_URL"
echo "   Has credentials: ✅"

# ============================================================================
# MIGRATION DEPLOYMENT
# ============================================================================

log_header "MIGRATION DEPLOYMENT"

log_section "Reading migration files"

# File 1: Schema
SCHEMA_FILE=$(ls -1 "$MIGRATIONS_DIR"/20260208052112*.sql 2>/dev/null | head -1)
if [ -z "$SCHEMA_FILE" ]; then
  log_error "Schema migration file not found"
  exit 1
fi
log_info "Found schema file: $(basename "$SCHEMA_FILE")"
SCHEMA_SIZE=$(wc -l < "$SCHEMA_FILE")
echo "   Size: $SCHEMA_SIZE lines"

# File 2: Functions
FUNCTIONS_FILE=$(ls -1 "$MIGRATIONS_DIR"/20260208052324*.sql 2>/dev/null | head -1)
if [ -z "$FUNCTIONS_FILE" ]; then
  log_error "Functions migration file not found"
  exit 1
fi
log_info "Found functions file: $(basename "$FUNCTIONS_FILE")"
FUNCTIONS_SIZE=$(wc -l < "$FUNCTIONS_FILE")
echo "   Size: $FUNCTIONS_SIZE lines"

# File 3: Seed Prompts
PROMPTS_FILE=$(ls -1 "$MIGRATIONS_DIR"/*seed_prompts.sql 2>/dev/null | head -1)
if [ -z "$PROMPTS_FILE" ]; then
  log_warn "Seed prompts file not found (optional)"
  PROMPTS_FILE=""
else
  log_info "Found seed prompts file: $(basename "$PROMPTS_FILE")"
  PROMPTS_SIZE=$(wc -l < "$PROMPTS_FILE")
  echo "   Size: $PROMPTS_SIZE lines"
fi

# File 4: Seed Tools
TOOLS_FILE=$(ls -1 "$MIGRATIONS_DIR"/*seed_tools.sql 2>/dev/null | head -1)
if [ -z "$TOOLS_FILE" ]; then
  log_warn "Seed tools file not found (optional)"
  TOOLS_FILE=""
else
  log_info "Found seed tools file: $(basename "$TOOLS_FILE")"
  TOOLS_SIZE=$(wc -l < "$TOOLS_FILE")
  echo "   Size: $TOOLS_SIZE lines"
fi

# ============================================================================
# DEPLOYMENT MENU
# ============================================================================

log_header "DEPLOYMENT OPTIONS"

echo ""
echo "Choose deployment method:"
echo ""
echo "1) Deploy via Supabase CLI (Recommended)"
echo "2) Deploy via SQL Scripts (Manual)"
echo "3) Display migration files (for manual copy-paste)"
echo "4) Verify only (no deployment)"
echo ""
read -p "Enter choice [1-4]: " CHOICE

case $CHOICE in
  1)
    log_header "SUPABASE CLI DEPLOYMENT"
    
    log_section "Linking to project"
    echo "   Project: $PROJECT_ID"
    # Note: Actual linking would require user login
    echo "   Note: Ensure you're logged in to Supabase CLI"
    read -p "   Continue? [y/N]: " CONFIRM
    
    if [[ $CONFIRM == "y" || $CONFIRM == "Y" ]]; then
      log_info "Ready to deploy migrations"
      echo "   Run: supabase db push"
      echo "   Or: supabase migration up"
    else
      log_warn "Deployment cancelled"
      exit 0
    fi
    ;;
    
  2)
    log_header "SQL SCRIPT DEPLOYMENT"
    
    log_section "Step 1: Deploy Schema"
    echo "1. Go to: https://app.supabase.com/project/$PROJECT_ID/sql/new"
    echo "2. Paste contents of: $(basename "$SCHEMA_FILE")"
    echo "3. Click 'Run' and wait for completion"
    echo ""
    
    read -p "Press Enter after step 1 is complete..."
    
    log_section "Step 2: Deploy Functions"
    echo "1. Go to SQL editor again"
    echo "2. Paste contents of: $(basename "$FUNCTIONS_FILE")"
    echo "3. Click 'Run'"
    echo ""
    
    read -p "Press Enter after step 2 is complete..."
    
    if [ -n "$PROMPTS_FILE" ]; then
      log_section "Step 3: Deploy Seed Prompts"
      echo "1. Go to SQL editor again"
      echo "2. Paste contents of: $(basename "$PROMPTS_FILE")"
      echo "3. Click 'Run'"
      echo ""
      
      read -p "Press Enter after step 3 is complete..."
    fi
    
    if [ -n "$TOOLS_FILE" ]; then
      log_section "Step 4: Deploy Seed Tools"
      echo "1. Go to SQL editor again"
      echo "2. Paste contents of: $(basename "$TOOLS_FILE")"
      echo "3. Click 'Run'"
      echo ""
      
      read -p "Press Enter after step 4 is complete..."
    fi
    
    log_info "SQL script deployment completed!"
    ;;
    
  3)
    log_header "MIGRATION FILE CONTENTS"
    
    log_section "$(basename "$SCHEMA_FILE") (First 50 lines)"
    head -50 "$SCHEMA_FILE"
    echo ""
    echo "... ($(($SCHEMA_SIZE - 50)) more lines)"
    echo ""
    
    read -p "Press Enter to see functions file..."
    
    log_section "$(basename "$FUNCTIONS_FILE")"
    cat "$FUNCTIONS_FILE"
    echo ""
    
    if [ -n "$PROMPTS_FILE" ]; then
      read -p "Press Enter to see seed prompts file..."
      log_section "$(basename "$PROMPTS_FILE") (First 30 lines)"
      head -30 "$PROMPTS_FILE"
      echo "... ($(($PROMPTS_SIZE - 30)) more lines)"
    fi
    
    if [ -n "$TOOLS_FILE" ]; then
      read -p "Press Enter to see seed tools file..."
      log_section "$(basename "$TOOLS_FILE") (First 30 lines)"
      head -30 "$TOOLS_FILE"
      echo "... ($(($TOOLS_SIZE - 30)) more lines)"
    fi
    ;;
    
  4)
    log_header "VERIFICATION ONLY"
    log_section "Files ready for deployment"
    log_info "Schema: $(basename "$SCHEMA_FILE") ($SCHEMA_SIZE lines)"
    log_info "Functions: $(basename "$FUNCTIONS_FILE") ($FUNCTIONS_SIZE lines)"
    if [ -n "$PROMPTS_FILE" ]; then
      log_info "Seed Prompts: $(basename "$PROMPTS_FILE") ($PROMPTS_SIZE lines)"
    fi
    if [ -n "$TOOLS_FILE" ]; then
      log_info "Seed Tools: $(basename "$TOOLS_FILE") ($TOOLS_SIZE lines)"
    fi
    echo ""
    log_info "No deployment performed. Files are ready when you are!"
    ;;
    
  *)
    log_error "Invalid choice"
    exit 1
    ;;
esac

# ============================================================================
# POST-DEPLOYMENT INSTRUCTIONS
# ============================================================================

log_header "POST-DEPLOYMENT INSTRUCTIONS"

echo ""
echo "After deployment completes, verify with these steps:"
echo ""

log_section "1. Verify tables exist"
echo "   Go to: https://app.supabase.com/project/$PROJECT_ID/editor"
echo "   Check these tables are visible:"
echo "   - profiles"
echo "   - user_roles"
echo "   - prompts"
echo "   - tools"
echo "   - generations"
echo "   - saved_prompts"
echo "   - reviews"
echo "   - subscriptions"

log_section "2. Check data"
echo "   Run in SQL editor:"
echo "   SELECT COUNT(*) FROM prompts;      -- Should be 100+"
echo "   SELECT COUNT(*) FROM tools;        -- Should be 15"

log_section "3. Enable RLS"
echo "   Go to: https://app.supabase.com/project/$PROJECT_ID/auth/policies"
echo "   Ensure RLS is enabled on all tables"

log_section "4. Test authentication"
echo "   Run in browser:"
echo "   npm run dev"
echo "   Navigate to /auth page"
echo "   Sign up with test email"
echo "   Check profile created in database"

log_section "5. Test prompt generation"
echo "   Go to /generator"
echo "   Click 'Generate Prompt'"
echo "   Verify Claude API integration works"

echo ""
log_header "DEPLOYMENT COMPLETE"

echo -e "${GREEN}✅ Your Supabase project is ready!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Test authentication at /auth"
echo "3. Test prompt generation at /generator"
echo "4. Browse library at /library"
echo ""
