/**
 * Behavior Tracking Layer
 * =======================
 * Fungsi: Track semua interaksi user untuk continuous learning & personalization.
 * Tujuan: Membuat sistem "Living Skill Intelligence" yang adaptif.
 *
 * Dibuat berdasarkan INTENT_DOC.txt requirement:
 * "2. Behavior Tracking Layer"
 * "Profil hidup dan adaptif"
 * "Arah semakin presisi seiring waktu"
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// ============================================================================
// TYPES
// ============================================================================

export type BehaviorEventType =
  // Navigation
  | "page_view"
  | "tab_switch"
  // Task engagement
  | "task_view"
  | "task_start"
  | "task_complete"
  | "task_skip"
  // Content engagement
  | "generator_use"
  | "content_copy"
  | "content_regenerate"
  // Checkpoint actions
  | "checkpoint_submit"
  | "checkpoint_status_change"
  // Profile actions
  | "profile_create"
  | "profile_reset"
  | "profile_upgrade"
  // Job research
  | "job_view_detail"
  | "job_accept_primary"
  | "job_view_alternative"
  // Market signals
  | "signal_click"
  | "signal_dismiss"
  // Risk responses
  | "risk_warning_view"
  | "pivot_accept"
  | "pivot_dismiss"
  // Roadmap
  | "week_expand"
  | "week_collapse"
  | "task_detail_expand";

export interface BehaviorEvent {
  /** User ID */
  userId: string;
  /** Event type */
  eventType: BehaviorEventType;
  /** Element ID that was interacted with */
  elementId?: string;
  /** Additional context */
  context?: Record<string, any>;
  /** Session ID for grouping events */
  sessionId: string;
  /** Timestamp (ISO) */
  timestamp: string;
  /** Page where event occurred */
  pageUrl: string;
  /** Time spent on page before event (ms) */
  timeOnPage?: number;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  pageViews: number;
  events: number;
  deviceType?: string;
  browser?: string;
}

export interface BehaviorInsight {
  /** Total sessions */
  totalSessions: number;
  /** Avg session duration (minutes) */
  avgSessionDuration: number;
  /** Most used tab */
  mostUsedTab: string;
  /** Task completion rate */
  taskCompletionRate: number;
  /** Most common stuck area */
  commonStuckArea: string;
  /** Engagement level (0-100) */
  engagementScore: number;
  /** Recommended actions */
  recommendations: string[];
}

// ============================================================================
// CONFIG
// ============================================================================

const TRACKING_CONFIG = {
  // Batch insert every N events
  BATCH_SIZE: 10,

  // Flush interval (ms)
  FLUSH_INTERVAL: 30000, // 30 seconds

  // Session timeout (ms)
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes

  // Enable/disable tracking
  ENABLED: import.meta.env.PROD || import.meta.env.VITE_ENABLE_TRACKING === "true",
};

// ============================================================================
// IN-MEMORY BUFFER (for batching)
// ============================================================================

let eventBuffer: BehaviorEvent[] = [];
let currentSession: UserSession | null = null;
let flushTimer: NodeJS.Timeout | null = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize behavior tracking
 * Call this when app loads
 */
export function initBehaviorTracking(userId: string): string {
  if (!TRACKING_CONFIG.ENABLED) return "dev-mode";

  // Resume or create session
  const sessionId = getOrCreateSession(userId);

  // Start flush timer
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => flushEvents(), TRACKING_CONFIG.FLUSH_INTERVAL);

  // Track initial page view
  trackEvent("page_view", { page: window.location.pathname });

  return sessionId;
}

/**
 * Cleanup on page unload
 */
export function cleanupBehaviorTracking() {
  if (flushTimer) clearInterval(flushTimer);
  flushEvents(); // Flush remaining events

  if (currentSession) {
    endSession(currentSession.sessionId);
  }
}

// ============================================================================
// TRACKING FUNCTIONS
// ============================================================================

/**
 * Track a behavior event
 * This is the MAIN function to call from components
 */
export function trackEvent(
  eventType: BehaviorEventType,
  context?: Record<string, any>,
  elementId?: string
): void {
  if (!TRACKING_CONFIG.ENABLED) return;

  const userId = getCurrentUserId();
  if (!userId) return;

  const sessionId = currentSession?.sessionId || getOrCreateSession(userId);

  const event: BehaviorEvent = {
    userId,
    eventType,
    elementId,
    context,
    sessionId,
    timestamp: new Date().toISOString(),
    pageUrl: window.location.pathname,
  };

  // Add to buffer
  eventBuffer.push(event);

  // Update session stats
  if (currentSession) {
    currentSession.events++;
  }

  // Flush if buffer is full
  if (eventBuffer.length >= TRACKING_CONFIG.BATCH_SIZE) {
    flushEvents();
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string): void {
  trackEvent("page_view", { page });
}

/**
 * Track task action
 */
export function trackTaskAction(
  action: "view" | "start" | "complete" | "skip",
  weekNumber: number,
  taskIndex: number,
  taskText: string
): void {
  trackEvent(
    `task_${action}` as BehaviorEventType,
    {
      weekNumber,
      taskIndex,
      taskText,
      difficulty: getTaskDifficulty(weekNumber, taskIndex),
    },
    `week-${weekNumber}-task-${taskIndex}`
  );
}

/**
 * Track generator usage
 */
export function trackGeneratorUsage(
  generatorType: string,
  inputLength: number,
  outputLength: number,
  regenerated: boolean
): void {
  trackEvent("generator_use", {
    generatorType,
    inputLength,
    outputLength,
    regenerated,
  });
}

/**
 * Track checkpoint submission
 */
export function trackCheckpointSubmit(
  weekNumber: number,
  status: "on_track" | "stuck" | "ahead",
  completionRate: number,
  marketResponse: boolean | null
): void {
  trackEvent("checkpoint_submit", {
    weekNumber,
    status,
    completionRate,
    marketResponse,
  });
}

/**
 * Track job research interaction
 */
export function trackJobResearchInteraction(
  action: "view_detail" | "accept_primary" | "view_alternative",
  jobTier: "primary" | "secondary" | "exploratory",
  jobTitle: string
): void {
  trackEvent(`job_${action}` as BehaviorEventType, {
    jobTier,
    jobTitle,
  });
}

/**
 * Track pivot response
 */
export function trackPivotResponse(accepted: boolean, reason?: string): void {
  trackEvent(accepted ? "pivot_accept" : "pivot_dismiss", { reason });
}

/**
 * Track tab switch (for most used tab calculation)
 */
export function trackTabSwitch(tabName: string): void {
  trackEvent("tab_switch", { tabName });
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

function getOrCreateSession(userId: string): string {
  // Check if current session is valid
  if (currentSession && currentSession.userId === userId) {
    const sessionAge = Date.now() - new Date(currentSession.startTime).getTime();
    if (sessionAge < TRACKING_CONFIG.SESSION_TIMEOUT) {
      return currentSession.sessionId;
    }
  }

  // Create new session
  const sessionId = `${userId}-${Date.now()}`;
  currentSession = {
    sessionId,
    userId,
    startTime: new Date().toISOString(),
    pageViews: 0,
    events: 0,
    deviceType: getDeviceType(),
    browser: getBrowser(),
  };

  // Save session to DB
  saveSessionToDB(currentSession);

  return sessionId;
}

function endSession(sessionId: string): void {
  if (!currentSession) return;

  currentSession.endTime = new Date().toISOString();

  // Update session in DB
  updateSessionInDB(currentSession);

  currentSession = null;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Flush buffered events to database
 */
async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const eventsToFlush = [...eventBuffer];
  eventBuffer = [];

  try {
    const { error } = await supabase.from("behavior_events").insert(
      eventsToFlush.map((e) => ({
        user_id: e.userId,
        event_type: e.eventType,
        element_id: e.elementId || null,
        context: (e.context || {}) as Json,
        session_id: e.sessionId,
        timestamp: e.timestamp,
        page_url: e.pageUrl,
        time_on_page: e.timeOnPage || null,
      }))
    );

    if (error) {
      console.error("[BehaviorTracking] Failed to flush events:", error);
      // Re-add to buffer on failure
      eventBuffer.unshift(...eventsToFlush);
    }
  } catch (err) {
    console.error("[BehaviorTracking] Error flushing events:", err);
    eventBuffer.unshift(...eventsToFlush);
  }
}

/**
 * Save session to database
 */
async function saveSessionToDB(session: UserSession): Promise<void> {
  try {
    const { error } = await supabase.from("behavior_sessions").insert({
      session_id: session.sessionId,
      user_id: session.userId,
      start_time: session.startTime,
      page_views: session.pageViews,
      events: session.events,
      device_type: session.deviceType,
      browser: session.browser,
    });

    if (error) {
      console.error("[BehaviorTracking] Failed to save session:", error);
    }
  } catch (err) {
    console.error("[BehaviorTracking] Error saving session:", err);
  }
}

/**
 * Update session in database
 */
async function updateSessionInDB(session: UserSession): Promise<void> {
  try {
    const { error } = await supabase
      .from("behavior_sessions")
      .update({
        end_time: session.endTime,
        page_views: session.pageViews,
        events: session.events,
      })
      .eq("session_id", session.sessionId);

    if (error) {
      console.error("[BehaviorTracking] Failed to update session:", error);
    }
  } catch (err) {
    console.error("[BehaviorTracking] Error updating session:", err);
  }
}

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

/**
 * Get behavior insights for a user
 * Use this to adapt the system based on user behavior
 */
export async function getBehaviorInsights(userId: string): Promise<BehaviorInsight> {
  try {
    // Get total sessions
    const { count: totalSessions } = await supabase
      .from("behavior_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get avg session duration
    const { data: sessions } = await supabase
      .from("behavior_sessions")
      .select("start_time, end_time")
      .eq("user_id", userId)
      .not("end_time", "is", null);

    const avgSessionDuration =
      sessions && sessions.length > 0
        ? sessions.reduce((sum, s) => {
            const duration =
              new Date(s.end_time || "").getTime() - new Date(s.start_time).getTime();
            return sum + duration;
          }, 0) / sessions.length / 60000 // to minutes
        : 0;

    // Get most used tab
    const { data: tabEvents } = await supabase
      .from("behavior_events")
      .select("context")
      .eq("user_id", userId)
      .eq("event_type", "tab_switch");

    const tabCounts: Record<string, number> = {};
    tabEvents?.forEach((e: any) => {
      const tab = e.context?.tabName || "unknown";
      tabCounts[tab] = (tabCounts[tab] || 0) + 1;
    });

    const mostUsedTab = Object.entries(tabCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "overview";

    // Get task completion rate
    const { data: taskEvents } = await supabase
      .from("behavior_events")
      .select("event_type")
      .eq("user_id", userId)
      .or("event_type.eq.task_complete,event_type.eq.task_start");

    const completed = taskEvents?.filter((e: any) => e.event_type === "task_complete").length || 0;
    const started = taskEvents?.filter((e: any) => e.event_type === "task_start").length || 0;
    const taskCompletionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

    // Get common stuck area
    const { data: checkpoints } = await supabase
      .from("behavior_events")
      .select("context")
      .eq("user_id", userId)
      .eq("event_type", "checkpoint_submit");

    const stuckAreas: Record<string, number> = {};
    checkpoints?.forEach((cp: any) => {
      const area = cp.context?.stuckArea || "none";
      if (area !== "none") {
        stuckAreas[area] = (stuckAreas[area] || 0) + 1;
      }
    });

    const commonStuckArea = Object.entries(stuckAreas).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

    // Calculate engagement score
    const { count: totalEvents } = await supabase
      .from("behavior_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const eventsPerSession = totalEvents && totalSessions ? totalEvents / totalSessions : 0;
    const engagementScore = Math.min(100, Math.round(
      (taskCompletionRate * 0.3) +
      (eventsPerSession * 5) +
      (Math.min(avgSessionDuration, 30) / 30 * 30)
    ));

    // Generate recommendations
    const recommendations: string[] = [];

    if (taskCompletionRate < 50) {
      recommendations.push("Task completion rate rendah. Pertimbangkan untuk simplify roadmap.");
    }

    if (avgSessionDuration < 5) {
      recommendations.push("Sesi sangat singkat. User mungkin stuck atau bingung.");
    }

    if (mostUsedTab === "overview" && totalSessions > 3) {
      recommendations.push("User stuck di overview. Perlu guidance untuk eksekusi.");
    }

    if (commonStuckArea !== "none") {
      recommendations.push(`Hambatan terbesar: ${commonStuckArea}. Sediakan resource spesifik.`);
    }

    if (engagementScore < 40) {
      recommendations.push("Engagement rendah. Pertimbangkan untuk re-kalibrasi profil.");
    }

    if (recommendations.length === 0) {
      recommendations.push("User progress baik. Lanjutkan strategy.");
    }

    return {
      totalSessions: totalSessions || 0,
      avgSessionDuration: Math.round(avgSessionDuration),
      mostUsedTab,
      taskCompletionRate,
      commonStuckArea,
      engagementScore,
      recommendations,
    };
  } catch (err) {
    console.error("[BehaviorTracking] Failed to get insights:", err);
    return {
      totalSessions: 0,
      avgSessionDuration: 0,
      mostUsedTab: "unknown",
      taskCompletionRate: 0,
      commonStuckArea: "unknown",
      engagementScore: 0,
      recommendations: ["Unable to analyze behavior"],
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getCurrentUserId(): string | null {
  // TODO: Get from auth context
  // For now, read from localStorage
  return localStorage.getItem("intent_user_id");
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (/chrome/i.test(ua)) return "chrome";
  if (/firefox/i.test(ua)) return "firefox";
  if (/safari/i.test(ua)) return "safari";
  return "unknown";
}

function getTaskDifficulty(week: number, task: number): string {
  if (week === 1) return "easy";
  if (week === 2) return "medium";
  if (week === 3) return "hard";
  return "expert";
}

// ============================================================================
// REACT HOOK (for easy usage in components)
// ============================================================================

/**
 * React hook for behavior tracking
 * Usage:
 *   const { trackEvent, trackPageView } = useBehaviorTracking();
 *   trackEvent("task_complete", { week: 1, task: 2 });
 */
export function useBehaviorTracking() {
  const trackEventRef = React.useRef(trackEvent);
  const trackPageViewRef = React.useRef(trackPageView);
  const trackTaskActionRef = React.useRef(trackTaskAction);
  const trackGeneratorUsageRef = React.useRef(trackGeneratorUsage);
  const trackCheckpointSubmitRef = React.useRef(trackCheckpointSubmit);

  return {
    trackEvent: trackEventRef.current,
    trackPageView: trackPageViewRef.current,
    trackTaskAction: trackTaskActionRef.current,
    trackGeneratorUsage: trackGeneratorUsageRef.current,
    trackCheckpointSubmit: trackCheckpointSubmitRef.current,
  };
}

// TypeScript import for React
import React from "react";
