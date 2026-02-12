import { useState, useEffect, useCallback } from "react";

const MINING_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export function useMiningTimer() {
  const [miningStartTime, setMiningStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem("gorilla_mining_start");
    return saved ? parseInt(saved) : null;
  });

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!miningStartTime) {
      setIsMining(false);
      setTimeRemaining(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - miningStartTime;
      const remaining = Math.max(0, MINING_DURATION - elapsed);

      if (remaining <= 0) {
        setIsMining(false);
        setTimeRemaining(0);
        setProgress(100);
        clearInterval(interval);
      } else {
        setIsMining(true);
        setTimeRemaining(remaining);
        setProgress((elapsed / MINING_DURATION) * 100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [miningStartTime]);

  const startMining = useCallback(() => {
    const now = Date.now();
    setMiningStartTime(now);
    localStorage.setItem("gorilla_mining_start", now.toString());
    setIsMining(true);
  }, []);

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
    miningComplete: miningStartTime !== null && !isMining && progress >= 100,
  };
}
