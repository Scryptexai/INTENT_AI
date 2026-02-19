/**
 * Test AI Analysis Engine with 10 Different Profiles
 * Checking for variety and personalization quality
 */

import { analyzeQuickProfile } from '../services/aiAnalysisEngine';
import type { QuickProfileResult } from '../utils/quickProfileConfig';

// Test profiles
const testProfiles: QuickProfileResult[] = [
  // Test 1: BEGINNER WRITER
  {
    skills: ['writing'],
    subSkill: 'blog_writing_seo',
    experience: 0,
    target: '2m_5m',
    time: '10-20h',
    timeline: '3_months',
    language: 'indonesia',
    stage: 'employee',
  },

  // Test 2: INTERMEDIATE DESIGNER WITH ENGLISH
  {
    skills: ['design'],
    subSkill: 'ui_ux_design',
    experience: 18,
    target: '5m_10m',
    time: '20-30h',
    timeline: '3_months',
    language: 'id_en_active',
    stage: 'freelancer',
  },

  // Test 3: ADVANCED MARKETING - URGENT 30 DAYS
  {
    skills: ['marketing'],
    subSkill: 'social_media_marketing',
    experience: 36,
    target: '10m+',
    time: '30+h',
    timeline: '30_days',
    language: 'id_en_active',
    stage: 'entrepreneur',
  },

  // Test 4: BEGINNER TECH STUDENT
  {
    skills: ['tech'],
    subSkill: 'web_dev_frontend',
    experience: 0,
    target: '500k_1m',
    time: '1-5h',
    timeline: '6_months',
    language: 'indonesia',
    stage: 'student',
  },

  // Test 5: INTERMEDIATE CONTENT CREATOR
  {
    skills: ['content_creator'],
    subSkill: 'influencer_edu',
    experience: 12,
    target: '2m_5m',
    time: '10-20h',
    timeline: '3_months',
    language: 'indonesia',
    stage: 'employee',
  },

  // Test 6: EXPERT VIDEOGRAPHER WITH ENGLISH
  {
    skills: ['video_photo'],
    subSkill: 'video_editing_reels',
    experience: 60,
    target: '10m+',
    time: '30+h',
    timeline: '30_days',
    language: 'english_fluent',
    stage: 'freelancer',
  },

  // Test 7: BEGINNER VA STUDENT
  {
    skills: ['business'],
    subSkill: 'virtual_assistant',
    experience: 0,
    target: '1m_2m',
    time: '5-10h',
    timeline: '6_months',
    language: 'indonesia',
    stage: 'student',
  },

  // Test 8: EXPERT COPYWRITER
  {
    skills: ['writing'],
    subSkill: 'copywriting_ads',
    experience: 48,
    target: '10m+',
    time: '20-30h',
    timeline: '30_days',
    language: 'id_en_active',
    stage: 'entrepreneur',
  },

  // Test 9: INTERMEDIATE SEO
  {
    skills: ['marketing'],
    subSkill: 'seo_specialist',
    experience: 24,
    target: '5m_10m',
    time: '20-30h',
    timeline: '3_months',
    language: 'indonesia',
    stage: 'freelancer',
  },

  // Test 10: BEGINNER GRAPHIC DESIGN
  {
    skills: ['design'],
    subSkill: 'social_media_design',
    experience: 3,
    target: '500k_1m',
    time: '5-10h',
    timeline: '6_months',
    language: 'indonesia',
    stage: 'employee',
  },
];

// Test function
export function testAIAnalysis() {
  console.log('🧪 TESTING AI ANALYSIS ENGINE WITH 10 PROFILES\n');
  console.log('='.repeat(80));

  testProfiles.forEach((profile, index) => {
    const analysis = analyzeQuickProfile(profile);

    console.log(`\n📊 TEST PROFILE #${index + 1}`);
    console.log('─'.repeat(80));
    console.log(`Domain: ${profile.skills[0]}`);
    console.log(`Sub-skill: ${profile.subSkill}`);
    console.log(`Experience: ${profile.experience} months (${analysis.readinessLevel})`);
    console.log(`Target: ${profile.target} | Timeline: ${profile.timeline}`);
    console.log(`Language: ${profile.language} | Stage: ${profile.stage}`);
    console.log('\n🎯 AI ANALYSIS RESULT:');
    console.log(`Today's Focus: ${analysis.todayFocus}`);
    console.log(`Target Market: ${analysis.targetMarket}`);
    console.log(`Income Potential: ${analysis.incomePotential}`);
    console.log(`First Step: ${analysis.firstStep}`);
    console.log('\n' + '─'.repeat(80));
  });

  // Check for variety
  console.log('\n\n🔍 VARIETY CHECK:');
  const todayFocus = testProfiles.map(p => analyzeQuickProfile(p).todayFocus);
  const uniqueFocus = new Set(todayFocus);
  console.log(`Unique "Today's Focus" messages: ${uniqueFocus.size} / ${testProfiles.length}`);

  const targetMarkets = testProfiles.map(p => analyzeQuickProfile(p).targetMarket);
  const uniqueMarkets = new Set(targetMarkets);
  console.log(`Unique target markets: ${uniqueMarkets.size} / ${testProfiles.length}`);

  const incomeProjections = testProfiles.map(p => analyzeQuickProfile(p).incomePotential);
  const uniqueIncome = new Set(incomeProjections);
  console.log(`Unique income projections: ${uniqueIncome.size} / ${testProfiles.length}`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ TEST COMPLETE\n');
}

// Run test if executed directly
if (typeof window !== 'undefined') {
  (window as any).testAIAnalysis = testAIAnalysis;
  console.log('💡 Run testAIAnalysis() in browser console to test');
}
