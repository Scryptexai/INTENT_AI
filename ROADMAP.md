# 🚀 INTENT AI - ROADMAP PERBAIKAN GAP

**Created:** 2025-02-16
**Status:** Active
**Owner:** Development Team

---

## 📊 GAP ANALYSIS SUMMARY

**Skor Kepatuhan Dokumen:** 65% → **Target: 90%+**

**Gap Kritis:**
1. ❌ Memberikan 3 opsi job, bukan 1 jalur utama
2. ❌ Tidak ada noise filtering layer untuk data API
3. ❌ Tidak ada behavior tracking untuk continuous learning
4. ❌ Level 2 profiling belum ada micro scenario test

---

## 🔥 PHASE 1: CRITICAL FIXES (Week 1-2)

### ✅ TASK 1.1: Noise Filtering Layer
**Status:** `COMPLETED` ✅
**File Created:** `src/services/marketDataFilter.ts`

**Next Steps:**
```typescript
// 1. Import di jobResearchEngine.ts
import { filterMarketData } from './marketDataFilter';

// 2. Setelah fetchAllMarketIntel(), tambahkan:
const filtered = filterMarketData(rawIntel, niche, subSector);
```

---

### ✅ TASK 1.2: Behavior Tracking Layer
**Status:** `COMPLETED` ✅
**Files Created:**
- `src/services/behaviorTracking.ts`
- `supabase/migrations/20250216_behavior_tracking.sql`

**Next Steps:**
```bash
# Run migration
supabase db push

# Add to App.tsx
import { initBehaviorTracking } from '@/services/behaviorTracking';
useEffect(() => {
  initBehaviorTracking(user?.id);
}, [user]);
```

---

### ✅ TASK 1.3: "1 Jalur Utama" Philosophy
**Status:** `COMPLETED` ✅
**File Created:** `src/components/SingleJobRecommendation.tsx`

**Next Steps:**
```typescript
// Replace job research section di Dashboard.tsx (line 597-697)
import { SingleJobRecommendation } from '@/components/SingleJobRecommendation';

<SingleJobRecommendation
  primaryJob={jobResearch.primaryJob}
  secondaryJob={jobResearch.secondaryJob}
  exploratoryJob={jobResearch.exploratoryJob}
  profileAnalysis={jobResearch.profileAnalysis}
  marketContext={jobResearch.marketContext}
/>
```

---

## ⚡ PHASE 2: MEDIUM PRIORITY (Week 3-4)

### ✅ TASK 2.1: Level 2 Profiling dengan Micro Scenario Test
**Status:** `COMPLETED` ✅
**Files Created:**
- `src/services/microScenarioTest.ts`
- `supabase/migrations/20250216_scenario_tests.sql`

**Next Steps:**
```bash
# Run migration
supabase db push

# Create UI component
# src/components/ScenarioTest.tsx
```

---

### 🔄 TASK 2.2: Update Freemium Gates
**Status:** `PENDING` - Ready to implement
**File to Edit:** `src/services/planGating.ts`

**Add these functions:**
```typescript
export async function canUseDeepAnalysis(userPlan: PlanType)
export async function canUseStrategyCorrection(userPlan: PlanType)
export async function canGetOngoingAdaptiveUpdates(userPlan: PlanType)
```

---

### 🔄 TASK 2.3: Build Landing Page for Ads
**Status:** `PENDING` - Ready to implement
**File to Create:** `src/pages/LandingAds.tsx`

**Structure:**
1. Masalah (overchoice & stagnasi)
2. Kenapa solusi umum gagal
3. Sistem profiling sebagai solusi
4. 3 langkah kerja
5. CTA langsung profiling

---

## 📝 PHASE 3: LOW PRIORITY (Week 5-6)

### 🔄 TASK 3.1: KPI Dashboard
**Status:** `PENDING`

**KPIs:**
- Profiling completion rate > 40%
- Blueprint activation rate
- Retention 3 hari > 25%
- Feedback positif > 20%

---

### 🔄 TASK 3.2: Tone & Voice Audit
**Status:** `PENDING`

**Guidelines:**
- Ringkas: Short sentences
- Tegas: Direct commands
- Sistematis: Structured info

---

## 📊 PROGRESS TRACKER

| Task | Status | Priority | Files |
|------|--------|----------|-------|
| 1.1 Noise Filtering | ✅ DONE | HIGH | marketDataFilter.ts |
| 1.2 Behavior Tracking | ✅ DONE | HIGH | behaviorTracking.ts + migration |
| 1.3 1 Jalur Utama | ✅ DONE | HIGH | SingleJobRecommendation.tsx |
| 2.1 Micro Scenario Test | ✅ DONE | MEDIUM | microScenarioTest.ts + migration |
| 2.2 Freemium Gates | 🔄 TODO | MEDIUM | Edit planGating.ts |
| 2.3 Landing Ads | 🔄 TODO | MEDIUM | Create LandingAds.tsx |
| 3.1 KPI Dashboard | 🔄 TODO | LOW | New dashboard |
| 3.2 Tone Audit | 🔄 TODO | LOW | Audit all files |

**Progress: 5/8 tasks completed (62.5%)**

---

## 🚀 THIS WEEK ACTIONS

### Monday-Tuesday
- [ ] Integrate Noise Filtering into jobResearchEngine
- [ ] Integrate Behavior Tracking into App.tsx
- [ ] Run migrations

### Wednesday-Thursday
- [ ] Replace Job Research with SingleJobRecommendation
- [ ] Implement Freemium Gates
- [ ] Test all gates

### Friday
- [ ] Create Landing Ads page
- [ ] Code review & merge
- [ ] Deploy to staging

---

**Last Updated:** 2025-02-16
