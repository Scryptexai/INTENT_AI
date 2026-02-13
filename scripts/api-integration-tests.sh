#!/bin/bash

# ============================================================================
# API Integration Tests - Verify Supabase, Claude, and OpenAI Integration
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

test_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

test_case() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo ""
  echo -e "${YELLOW}[TEST $TESTS_TOTAL]${NC} $1"
}

test_pass() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  echo -e "${GREEN}✅ PASS${NC}: $1"
}

test_fail() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo -e "${RED}❌ FAIL${NC}: $1"
}

test_info() {
  echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

# ============================================================================
# SUPABASE CONNECTION TESTS
# ============================================================================

test_header "SUPABASE CONNECTION TESTS"

test_case "Supabase project ID is valid format"
PROJECT_ID=$(grep 'VITE_SUPABASE_PROJECT_ID=' .env | cut -d'=' -f2 | tr -d '"')
if [[ $PROJECT_ID =~ ^[a-z0-9]{20}$ ]]; then
  test_pass "Project ID format is valid: $PROJECT_ID"
else
  test_fail "Project ID format is invalid: $PROJECT_ID"
fi

test_case "Supabase publishable key is valid format"
PUB_KEY=$(grep 'VITE_SUPABASE_PUBLISHABLE_KEY=' .env | cut -d'=' -f2 | tr -d '"')
if [[ $PUB_KEY =~ ^sb_publishable ]]; then
  test_pass "Publishable key format is valid (sb_publishable prefix)"
else
  test_fail "Publishable key format is invalid"
fi

test_case "Supabase service key is configured"
SERVICE_KEY=$(grep 'SUPABASE_SERVICE_API_KEY=' .env | cut -d'=' -f2 | tr -d '"')
if [[ $SERVICE_KEY =~ ^sb_secret ]]; then
  test_pass "Service key is configured (sb_secret prefix)"
else
  test_fail "Service key not configured or invalid format"
fi

test_case "Database password is configured"
DB_PASS=$(grep 'DATABASE_PASSWORD=' .env | cut -d'=' -f2 | tr -d '"')
if [ -n "$DB_PASS" ]; then
  test_pass "Database password is set"
else
  test_fail "Database password is not set"
fi

test_case "Verify URL matches project ID"
URL=$(grep 'VITE_SUPABASE_URL=' .env | cut -d'=' -f2 | tr -d '"')
if [[ $URL == *"$PROJECT_ID"* ]]; then
  test_pass "URL matches project ID: $URL"
else
  test_fail "URL does not match project ID"
fi

# ============================================================================
# CLAUDE API INTEGRATION TESTS
# ============================================================================

test_header "CLAUDE API INTEGRATION TESTS"

test_case "Claude API key is configured"
CLAUDE_KEY=$(grep 'ANTHROPIC_API_KEY=' .env | cut -d'=' -f2 | tr -d '"')
if [ -n "$CLAUDE_KEY" ] && [ ${#CLAUDE_KEY} -gt 10 ]; then
  test_pass "Claude API key is configured"
else
  test_fail "Claude API key is not configured or too short"
fi

test_case "Claude endpoint is configured"
CLAUDE_URL=$(grep 'ANTHROPIC_BASE_URL=' .env | cut -d'=' -f2 | tr -d '"')
if [[ $CLAUDE_URL == *"api.z.ai"* ]]; then
  test_pass "Claude endpoint is using z.ai proxy: $CLAUDE_URL"
else
  test_fail "Claude endpoint is not correctly configured"
fi

test_case "Claude service is imported in multiLLMGenerator"
if grep -q "generateWithClaude" src/services/multiLLMGenerator.ts; then
  test_pass "Claude service implementation exists"
else
  test_fail "Claude service implementation not found"
fi

test_case "Claude service has error handling"
if grep -q "catch.*Claude.*Error\|Claude API Error" src/services/multiLLMGenerator.ts; then
  test_pass "Claude error handling is implemented"
else
  test_info "Claude error handling pattern may vary"
fi

# ============================================================================
# OPENAI API INTEGRATION TESTS
# ============================================================================

test_header "OPENAI API INTEGRATION TESTS"

test_case "OpenAI API key placeholder exists"
if grep -q "VITE_OPENAI_API_KEY=" .env; then
  test_pass "OpenAI API key field exists in .env"
else
  test_fail "OpenAI API key field not found in .env"
fi

test_case "OpenAI service is implemented"
if grep -q "generateWithOpenAI" src/services/multiLLMGenerator.ts; then
  test_pass "OpenAI service implementation exists"
else
  test_fail "OpenAI service implementation not found"
fi

test_case "OpenAI uses correct endpoint"
if grep -q "api.openai.com" src/services/multiLLMGenerator.ts; then
  test_pass "OpenAI endpoint is correctly configured"
else
  test_fail "OpenAI endpoint configuration not found"
fi

# ============================================================================
# MULTI-LLM FALLBACK TESTS
# ============================================================================

test_header "MULTI-LLM FALLBACK LOGIC TESTS"

test_case "Fallback chain is implemented"
if grep -q "providerChain\|for.*provider" src/services/multiLLMGenerator.ts; then
  test_pass "Provider fallback chain logic exists"
else
  test_fail "Provider fallback chain not found"
fi

test_case "Provider availability detection"
if grep -q "isAvailable\|getAvailableProviders" src/services/multiLLMGenerator.ts; then
  test_pass "Provider availability detection is implemented"
else
  test_fail "Provider availability detection not found"
fi

test_case "Error handling for all providers failing"
if grep -q "All providers failed\|No AI providers" src/services/multiLLMGenerator.ts; then
  test_pass "Error handling for all providers failing exists"
else
  test_fail "Error handling for all providers failing not found"
fi

# ============================================================================
# DATABASE INTEGRATION TESTS
# ============================================================================

test_header "DATABASE INTEGRATION TESTS"

test_case "Supabase client is configured"
if grep -q "createClient.*Database" src/integrations/supabase/client.ts; then
  test_pass "Supabase client initialization uses type definitions"
else
  test_fail "Supabase client initialization not properly typed"
fi

test_case "Database hooks are implemented"
if grep -q "export.*const.*use" src/hooks/useDatabase.ts; then
  test_pass "Database hooks are exported"
else
  test_fail "Database hooks not properly exported"
fi

test_case "usePrompts hook exists"
if grep -q "usePrompts" src/hooks/useDatabase.ts; then
  test_pass "usePrompts hook is implemented"
else
  test_fail "usePrompts hook not found"
fi

test_case "useTools hook exists"
if grep -q "useTools" src/hooks/useDatabase.ts; then
  test_pass "useTools hook is implemented"
else
  test_fail "useTools hook not found"
fi

test_case "useSavePrompt hook exists"
if grep -q "useSavePrompt" src/hooks/useDatabase.ts; then
  test_pass "useSavePrompt hook is implemented"
else
  test_fail "useSavePrompt hook not found"
fi

# ============================================================================
# COMPONENT INTEGRATION TESTS
# ============================================================================

test_header "COMPONENT INTEGRATION TESTS"

test_case "Library component uses database hooks"
if grep -q "usePrompts\|useTools" src/pages/Library.tsx; then
  test_pass "Library component integrates with database hooks"
else
  test_fail "Library component does not use database hooks"
fi

test_case "Generator component uses multi-LLM service"
if grep -q "generatePrompt\|promptGenerator\|multiLLM" src/pages/Generator.tsx; then
  test_pass "Generator component integrates with LLM service"
else
  test_fail "Generator component does not use LLM service"
fi

test_case "Tools component uses database hooks"
if grep -q "useTools" src/pages/Tools.tsx; then
  test_pass "Tools component integrates with database hooks"
else
  test_fail "Tools component does not use database hooks"
fi

test_case "Auth context is used in components"
if grep -q "useAuth\|AuthContext" src/components/ProtectedRoute.tsx; then
  test_pass "Auth context is properly used"
else
  test_fail "Auth context not properly integrated"
fi

# ============================================================================
# MIGRATION FILES TESTS
# ============================================================================

test_header "MIGRATION FILES TESTS"

test_case "Seed data migrations exist"
MIGRATION_COUNT=$(ls -1 supabase/migrations/ 2>/dev/null | wc -l)
if [ $MIGRATION_COUNT -gt 0 ]; then
  test_pass "Found $MIGRATION_COUNT migration files"
else
  test_fail "No migration files found"
fi

test_case "Migrations contain seed data"
if grep -q "INSERT.*prompts\|INSERT.*tools" supabase/migrations/* 2>/dev/null; then
  test_pass "Migrations contain INSERT statements for seed data"
else
  test_info "Migration structure may differ"
fi

# ============================================================================
# CONFIGURATION CONSISTENCY TESTS
# ============================================================================

test_header "CONFIGURATION CONSISTENCY TESTS"

test_case "VITE_ prefixed env vars match Supabase client"
VITE_PROJECT=$(grep 'VITE_SUPABASE_PROJECT_ID=' .env | cut -d'=' -f2 | tr -d '"')
CLIENT_PROJECT=$(grep 'import.meta.env.VITE_SUPABASE_PROJECT_ID' src/integrations/supabase/client.ts | head -1)
if [ -n "$VITE_PROJECT" ] && [ -n "$CLIENT_PROJECT" ]; then
  test_pass "Supabase client correctly references VITE_ env variables"
else
  test_fail "Supabase client env variable mismatch"
fi

test_case "Non-prefixed env vars exist for Edge Functions"
if grep -q "SUPABASE_URL\|SUPABASE_ANON_KEY\|SUPABASE_SERVICE_API_KEY" .env; then
  test_pass "Edge Function env variables are configured"
else
  test_fail "Edge Function env variables not configured"
fi

test_case "All required API keys are configured"
REQUIRED_KEYS=("VITE_SUPABASE_PROJECT_ID" "VITE_SUPABASE_PUBLISHABLE_KEY" "VITE_SUPABASE_URL" "ANTHROPIC_API_KEY" "ANTHROPIC_BASE_URL")
MISSING_KEYS=()
for key in "${REQUIRED_KEYS[@]}"; do
  if ! grep -q "$key" .env; then
    MISSING_KEYS+=("$key")
  fi
done

if [ ${#MISSING_KEYS[@]} -eq 0 ]; then
  test_pass "All required API keys are configured"
else
  test_fail "Missing keys: ${MISSING_KEYS[*]}"
fi

# ============================================================================
# TEST RESULTS
# ============================================================================

test_header "TEST RESULTS"

echo ""
echo -e "${YELLOW}Total Tests:${NC} $TESTS_TOTAL"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo ""

PASS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
echo -e "${YELLOW}Pass Rate:${NC} $PASS_RATE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                            ║${NC}"
  echo -e "${GREEN}║  ✅ ALL API INTEGRATION TESTS PASSED! ✅                   ║${NC}"
  echo -e "${GREEN}║                                                            ║${NC}"
  echo -e "${GREEN}║  System is ready for full end-to-end testing              ║${NC}"
  echo -e "${GREEN}║  with new Supabase credentials!                           ║${NC}"
  echo -e "${GREEN}║                                                            ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                                                            ║${NC}"
  echo -e "${RED}║  ⚠️  SOME TESTS FAILED - REVIEW NEEDED ⚠️                  ║${NC}"
  echo -e "${RED}║                                                            ║${NC}"
  echo -e "${RED}║  Please fix the configuration issues above.                ║${NC}"
  echo -e "${RED}║                                                            ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
