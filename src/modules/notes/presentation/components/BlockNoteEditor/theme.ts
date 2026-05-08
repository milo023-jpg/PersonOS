// BlockNote Theme - Transparent background to integrate with app
// The CSS variables will be applied to the editor element
export const appTheme = {
  colors: {
    editor: {
      text: "var(--text-primary)",
      background: "transparent",
    },
    menu: {
      text: "var(--text-primary)",
      background: "var(--surface)",
    },
    tooltip: {
      text: "var(--text-primary)",
      background: "var(--surface)",
    },
    hovered: {
      text: "var(--text-primary)",
      background: "rgba(128, 128, 128, 0.1)",
    },
    selected: {
      text: "#ffffff",
      background: "var(--primary)",
    },
    disabled: {
      text: "var(--text-secondary)",
      background: "transparent",
    },
    shadow: "rgba(0, 0, 0, 0.3)",
    border: "rgba(128, 128, 128, 0.2)",
    sideMenu: "#94a3b8",
    highlights: {
      gray: { text: "#94a3b8", background: "rgba(148, 163, 184, 0.15)" },
      brown: { text: "#a8a29e", background: "rgba(168, 162, 158, 0.15)" },
      red: { text: "#f87171", background: "rgba(248, 113, 113, 0.15)" },
      orange: { text: "#fb923c", background: "rgba(251, 146, 60, 0.15)" },
      yellow: { text: "#facc15", background: "rgba(250, 204, 21, 0.15)" },
      green: { text: "#4ade80", background: "rgba(74, 222, 128, 0.15)" },
      blue: { text: "#38bdf8", background: "rgba(56, 189, 248, 0.15)" },
      purple: { text: "#c084fc", background: "rgba(192, 132, 252, 0.15)" },
      pink: { text: "#f472b6", background: "rgba(244, 114, 182, 0.15)" },
    },
  },
  borderRadius: 8,
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};
