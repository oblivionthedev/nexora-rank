const levels = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(minimum = "info") {
  const threshold = levels[minimum] ?? levels.info;
  return Object.fromEntries(
    Object.entries(levels).map(([level, weight]) => [
      level,
      (message, details = {}) => {
        if (weight < threshold) return;
        const line = JSON.stringify({
          time: new Date().toISOString(),
          service: "nexora-support",
          level,
          message,
          ...details,
        });
        (level === "error" ? console.error : console.log)(line);
      },
    ]),
  );
}
