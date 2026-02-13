import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt_text: string;
  category: string;
  ai_tool: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  premium: boolean;
  tags: string[];
  upvotes: number;
  copies: number;
  views: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  category: string[];
  pricing_min: number | null;
  pricing_max: number | null;
  pricing_model: string;
  rating: number;
  review_count: number;
  features: Record<string, any>;
  pros: string[];
  cons: string[];
  affiliate_link: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePromptsOptions {
  category?: string;
  tool?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface UsePromptResult {
  prompts: Prompt[];
  loading: boolean;
  total: number;
  error: string | null;
}

interface UseSinglePromptResult {
  prompt: Prompt | null;
  loading: boolean;
  error: string | null;
}

interface UseToolsOptions {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface UseToolsResult {
  tools: Tool[];
  loading: boolean;
  total: number;
  error: string | null;
}

/**
 * Fetch prompts with filtering, search, and pagination
 */
export const usePrompts = (options: UsePromptsOptions = {}): UsePromptResult => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { category, tool, difficulty, search, page = 1, limit = 24 } = options;

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("prompts")
          .select("*", { count: "exact" });

        // Apply filters
        if (category && category !== "All") {
          query = query.eq("category", category);
        }

        if (tool && tool !== "All") {
          query = query.eq("ai_tool", tool);
        }

        if (difficulty && difficulty !== "All") {
          query = query.eq(
            "difficulty",
            difficulty.toLowerCase() as "beginner" | "intermediate" | "advanced"
          );
        }

        if (search && search.trim()) {
          query = query.or(
            `title.ilike.%${search}%,description.ilike.%${search}%`
          );
        }

        // Sort and paginate
        query = query
          .order("created_at", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        const { data, error: dbError, count } = await query;

        if (dbError) {
          setError(dbError.message);
          toast.error("Failed to fetch prompts");
        } else {
          setPrompts(data || []);
          setTotal(count || 0);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        toast.error("Error fetching prompts");
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [category, tool, difficulty, search, page, limit]);

  return { prompts, loading, total, error };
};

/**
 * Fetch a single prompt by ID
 */
export const usePrompt = (id: string | undefined): UseSinglePromptResult => {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setPrompt(null);
      setLoading(false);
      setError("Missing prompt id");
      return;
    }

    const fetchPrompt = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from("prompts")
          .select("*")
          .eq("id", id)
          .single();

        if (dbError) {
          setError(dbError.message);
          toast.error("Failed to load prompt");
          setPrompt(null);
        } else {
          setPrompt((data as Prompt) || null);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        toast.error("Error fetching prompt");
        setPrompt(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id]);

  return { prompt, loading, error };
};

/**
 * Fetch tools with filtering, search, and pagination
 */
export const useTools = (options: UseToolsOptions = {}): UseToolsResult => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { category, search, page = 1, limit = 24 } = options;

  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("tools")
          .select("*", { count: "exact" });

        // Apply filters
        if (category && category !== "All") {
          query = query.contains("category", [category]);
        }

        if (search && search.trim()) {
          query = query.or(
            `name.ilike.%${search}%,description.ilike.%${search}%`
          );
        }

        // Sort and paginate
        query = query
          .order("rating", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        const { data, error: dbError, count } = await query;

        if (dbError) {
          setError(dbError.message);
          toast.error("Failed to fetch tools");
        } else {
          setTools((data as Tool[]) || []);
          setTotal(count || 0);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        toast.error("Error fetching tools");
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [category, search, page, limit]);

  return { tools, loading, total, error };
};

/**
 * Save a prompt to user's library
 */
export const useSavePrompt = () => {
  const savePrompt = async (userId: string, promptId: string) => {
    try {
      const { error } = await supabase.from("saved_prompts").insert({
        user_id: userId,
        prompt_id: promptId,
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.info("Already saved");
          return { success: false, alreadySaved: true };
        }
        toast.error("Failed to save");
        return { success: false };
      }

      toast.success("Saved to library");
      return { success: true };
    } catch (err) {
      console.error("Save prompt error:", err);
      toast.error("Error saving prompt");
      return { success: false };
    }
  };

  return { savePrompt };
};

/**
 * Copy prompt to clipboard and track the action via RPC
 */
export const useCopyPrompt = () => {
  const copyPrompt = async (promptId: string, text: string) => {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(text);

      // Track copy in database via RPC (fire and forget)
      supabase.rpc("increment_copy", { p_prompt_id: promptId }).then(({ error }) => {
        if (error) console.warn("Copy tracking failed:", error);
      });

      toast.success("Copied!");
      return true;
    } catch (err) {
      console.error("Copy error:", err);
      // Fallback for older browsers
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success("Copied!");
        return true;
      } catch {
        toast.error("Failed to copy");
        return false;
      }
    }
  };

  return { copyPrompt };
};

/**
 * Toggle upvote on a prompt (insert/remove vote + update count atomically)
 */
export const useUpvotePrompt = () => {
  const toggleUpvote = async (promptId: string): Promise<{ upvoted: boolean; upvotes: number } | null> => {
    try {
      const { data, error } = await supabase.rpc("toggle_upvote", {
        p_prompt_id: promptId,
      });

      if (error) {
        if (error.message.includes("Not authenticated")) {
          toast.error("Please log in to upvote");
        } else {
          toast.error("Failed to upvote");
        }
        return null;
      }

      return data as unknown as { upvoted: boolean; upvotes: number };
    } catch (err) {
      console.error("Upvote error:", err);
      toast.error("Error toggling upvote");
      return null;
    }
  };

  return { toggleUpvote };
};

/**
 * Check if the current user has voted on a prompt
 */
export const useCheckUserVote = (promptId: string | undefined) => {
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!promptId) return;

    const checkVote = async () => {
      try {
        const { data, error } = await supabase.rpc("check_user_vote", {
          p_prompt_id: promptId,
        });

        if (!error && typeof data === "boolean") {
          setHasVoted(data);
        }
      } catch {
        // silently fail — user might not be logged in
      }
    };

    checkVote();
  }, [promptId]);

  return { hasVoted, setHasVoted };
};

/**
 * Increment view count for a prompt (fire-and-forget)
 */
export const useIncrementView = () => {
  const incrementView = (promptId: string) => {
    supabase.rpc("increment_view", { p_prompt_id: promptId }).then(({ error }) => {
      if (error) console.warn("View tracking failed:", error);
    });
  };

  return { incrementView };
};

