const levels = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(selectedLevel = "info") {
  const threshold = levels[selectedLevel] ?? levels.info;

  function write(level, message, details = {}) {
    if (levels[level] < threshold) return;
    const record = { time: new Date().toISOString(), level, message, ...details };
    const line = JSON.stringify(record);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  return {
    debug: (message, details) => write("debug", message, details),
    info: (message, details) => write("info", message, details),
    warn: (message, details) => write("warn", message, details),
    error: (message, details) => write("error", message, details),
  };
}
