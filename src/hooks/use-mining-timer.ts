import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const MINING_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export function useMiningTimer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [miningStartTime, setMiningStartTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load active mining session from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("mining_sessions")
        .select("*")
        .eq("user_id", user.id)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setMiningStartTime(new Date(data.started_at).getTime());
        setSessionId(data.id);
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  // Tick
  useEffect(() => {
    if (!miningStartTime) {
      setIsMining(false);
      setTimeRemaining(0);
      setProgress(0);
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - miningStartTime;
      const remaining = Math.max(0, MINING_DURATION - elapsed);

      if (remaining <= 0) {
        setIsMining(false);
        setTimeRemaining(0);
        setProgress(100);
      } else {
        setIsMining(true);
        setTimeRemaining(remaining);
        setProgress((elapsed / MINING_DURATION) * 100);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [miningStartTime]);

  // Complete mining when timer hits 0
  useEffect(() => {
    if (!loaded || !sessionId || isMining || progress < 100) return;

    const complete = async () => {
      // Only update if not already completed
      const { data: session } = await supabase
        .from("mining_sessions")
        .select("completed_at")
        .eq("id", sessionId)
        .single();

      if (session?.completed_at) return; // Already completed

      const { error } = await supabase
        .from("mining_sessions")
        .update({ completed_at: new Date().toISOString(), coins_earned: 24 })
        .eq("id", sessionId);

      if (!error && user) {
        // Increment coin_balance and total_mined
        const { data: profile } = await supabase
          .from("profiles")
          .select("coin_balance, total_mined")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              coin_balance: profile.coin_balance + 24,
              total_mined: profile.total_mined + 24,
            })
            .eq("user_id", user.id);
        }

        // Send mining completion notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Mining Complete! ⛏️",
          message: "Your 24-hour mining session is complete! You earned 24 GOR coins.",
          type: "mining",
          action_url: "/mine",
        });

        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      }
    };
    complete();
  }, [loaded, sessionId, isMining, progress, user, queryClient]);

  const startMining = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const { data, error } = await supabase
      .from("mining_sessions")
      .insert({ user_id: user.id, started_at: now.toISOString() })
      .select()
      .single();

    if (!error && data) {
      setMiningStartTime(now.getTime());
      setSessionId(data.id);
      setIsMining(true);
    }
  }, [user]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return {
    isMining,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    progress,
    startMining,
    miningComplete: loaded && miningStartTime !== null && !isMining && progress >= 100,
  };
}
