import { useEffect, useState, useRef } from "react";
import { useFactoryStore } from "../../game/store/factoryStore";
import { ROLE_COLORS } from "../../game/domain/types";

interface LogEntry {
  id: string;
  time: string;
  role: string;
  message: string;
}

const LOG_MESSAGES = {
  data: [
    "Data pipeline optimized.",
    "Sanitizing training dataset...",
    "Anomalies filtered from incoming batch.",
    "Tokenizing neural inputs.",
    "Data batch successfully ingested.",
  ],
  model: [
    "Backpropagation converged.",
    "Gradient descent step applied.",
    "Weights updated successfully.",
    "Loss function minimized.",
    "Epoch completed. Accuracy improved.",
  ],
  security: [
    "Firewall anomaly neutralized.",
    "Intrusion prevented via ZipZap protocol.",
    "Zero-day exploit isolated.",
    "DDoS mitigation active.",
    "Network packets scrubbed.",
  ],
  power: [
    "Power grid stabilized.",
    "Voltage routed to AI Core.",
    "Capacitors fully charged.",
    "Energy flux normalized.",
    "Backup generators on standby.",
  ],
  knowledge: [
    "AI terminology validated.",
    "Knowledge base updated.",
    "Concept parameters aligned.",
    "Semantic definitions refined.",
    "Lexicon node synchronized.",
  ]
};

function getRandomMessage(role: keyof typeof LOG_MESSAGES) {
  const messages = LOG_MESSAGES[role];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function AiActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (role: keyof typeof LOG_MESSAGES) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0')}`;
    
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time,
      role,
      message: getRandomMessage(role),
    };
    
    setLogs((prev) => {
      const next = [...prev, newLog];
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
  };

  useFactoryStore.useHostActionListener(() => addLog("power"),    { actionNames: ["tapPower"] });
  useFactoryStore.useHostActionListener(() => addLog("data"),     { actionNames: ["sortData"] });
  useFactoryStore.useHostActionListener(() => addLog("security"), { actionNames: ["zipZap"] });
  useFactoryStore.useHostActionListener(() => addLog("model"),    { actionNames: ["solvePuzzle"] });
  useFactoryStore.useHostActionListener(() => addLog("knowledge"), { actionNames: ["solveKnowledgeTerm"] });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      style={{
        position: "absolute",
        left: 20,
        bottom: 20,
        width: 320,
        height: 180,
        background: "rgba(10, 15, 26, 0.75)",
        border: "1px solid rgba(56, 189, 248, 0.15)",
        borderRadius: 8,
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
        overflow: "hidden",
        boxShadow: "0 0 20px rgba(0,0,0,0.5)"
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid rgba(56, 189, 248, 0.15)",
          fontSize: 10,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#38bdf8",
          background: "rgba(56, 189, 248, 0.05)"
        }}
      >
        AI Operations Log
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          padding: "8px 12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontFamily: "var(--font-mono, monospace)"
        }}
      >
        {logs.map((log) => (
          <div key={log.id} style={{ display: "flex", gap: 8, fontSize: 10 }}>
            <span style={{ color: "#64748b", flexShrink: 0 }}>[{log.time}]</span>
            <span style={{ color: ROLE_COLORS[log.role as keyof typeof ROLE_COLORS], fontWeight: 700, flexShrink: 0, width: 65 }}>
              {log.role.toUpperCase()}
            </span>
            <span style={{ color: "#cbd5e1", flex: 1, wordBreak: "break-word" }}>{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div style={{ color: "#475569", fontSize: 10, fontStyle: "italic" }}>
            Waiting for subsystem activity...
          </div>
        )}
      </div>
    </div>
  );
}
