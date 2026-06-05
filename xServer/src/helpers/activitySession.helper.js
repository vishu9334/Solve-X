export const getEventSeverity = (eventType) => {
  const map = {
    TAB_SWITCHED: "critical",
    PAGE_REFRESH: "critical",
    PAGE_CLOSE: "critical",

    FULLSCREEN_EXITED: "warning",
    WINDOW_BLUR: "warning",
    SCREEN_RESIZED: "warning",

    FULLSCREEN_PROMPT_SHOWN: "info",
    FULLSCREEN_ENTERED: "info",
    TAB_RETURNED: "info",
    WINDOW_FOCUS: "info",
    TEST_STARTED: "info",
    TEST_SUBMITTED: "info",
    TIME_EXPIRED: "info",
  };

  return map[eventType] ?? "info";
};

export const computeActivityDecision = (session) => {
  if (session.hasPageClose) {
    return {
      decision: "rejected",
      reason: "User attempted to close or leave the page during exam",
    };
  }

  if (session.criticalCount >= 3) {
    return {
      decision: "rejected",
      reason: `Critical violations exceeded limit: ${session.criticalCount}`,
    };
  }

  if (
    session.hasTabSwitch ||
    session.hasFullscreenExit ||
    session.warningCount >= 3 ||
    session.criticalCount >= 1
  ) {
    return { decision: "suspicious", reason: null };
  }

  return { decision: "clean", reason: null };
};

export const getFlagUpdate = (eventType) => {
  const flagMap = {
    TAB_SWITCHED: { hasTabSwitch: true },
    FULLSCREEN_EXITED: { hasFullscreenExit: true },
    SCREEN_RESIZED: { hasScreenResize: true },
    PAGE_CLOSE: { hasPageClose: true },
  };

  return flagMap[eventType] ?? {};
};
