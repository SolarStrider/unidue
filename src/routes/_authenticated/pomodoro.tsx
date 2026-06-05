import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pause, Play, RotateCcw, Coffee, Brain } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pomodoro")({
  component: PomodoroPage,
});

const PRESETS = [
  { label: "Classic 25/5", work: 25, brk: 5 },
  { label: "Long focus 50/10", work: 50, brk: 10 },
  { label: "Deep work 90/15", work: 90, brk: 15 },
];

function PomodoroPage() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [seconds, setSeconds] = useState(PRESETS[0].work * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    setSeconds((mode === "work" ? preset.work : preset.brk) * 60);
    setRunning(false);
  }, [preset, mode]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          notify();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function notify() {
    const msg = mode === "work" ? "Focus session complete! Take a break" : "Break over - back to work";
    toast.success(msg);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Studiq Pomodoro", { body: msg });
    }
    setMode((m) => (m === "work" ? "break" : "work"));
  }

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pomodoro</h1>
        <p className="text-sm text-muted-foreground">Work in focused intervals with regular short breaks.</p>
      </div>

      <Card>
        <CardContent className="p-8 flex flex-col items-center gap-6">
          <div className="flex gap-2">
            <Button variant={mode === "work" ? "default" : "outline"} size="sm" onClick={() => setMode("work")}>
              <Brain className="h-4 w-4 mr-1" /> Work
            </Button>
            <Button variant={mode === "break" ? "default" : "outline"} size="sm" onClick={() => setMode("break")}>
              <Coffee className="h-4 w-4 mr-1" /> Break
            </Button>
          </div>
          <div className="text-7xl md:text-8xl font-bold tabular-nums tracking-tight">{mins}:{secs}</div>
          <div className="flex gap-2">
            <Button onClick={() => setRunning(!running)} size="lg">
              {running ? <><Pause className="h-5 w-5 mr-1" /> Pause</> : <><Play className="h-5 w-5 mr-1" /> Start</>}
            </Button>
            <Button variant="outline" size="lg" onClick={() => { setRunning(false); setSeconds((mode === "work" ? preset.work : preset.brk) * 60); }}>
              <RotateCcw className="h-5 w-5 mr-1" /> Reset
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {PRESETS.map((p) => (
              <Button key={p.label} variant={preset.label === p.label ? "secondary" : "ghost"} size="sm" onClick={() => setPreset(p)}>
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">What is the Pomodoro Technique?</p>
          <p>Developed by Francesco Cirillo in the late 1980s, the Pomodoro Technique uses a timer to break work into focused intervals (traditionally 25 minutes) separated by short breaks. After four pomodoros, take a longer break. It helps reduce mental fatigue and improve focus.</p>
        </CardContent>
      </Card>
    </div>
  );
}