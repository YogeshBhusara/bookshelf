import { THEME_BACKGROUNDS, type ResolvedTheme } from "./theme";

const EXPAND_MS = 760;
const DISSOLVE_MS = 520;

export interface ThemeRippleOrigin {
  x: number;
  y: number;
  theme: ResolvedTheme;
}

function rippleRadius(x: number, y: number): number {
  return (
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ) + 24
  );
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function waitForAnimation(animation: Animation): Promise<void> {
  return new Promise((resolve) => {
    animation.addEventListener("finish", () => resolve(), { once: true });
    animation.addEventListener("cancel", () => resolve(), { once: true });
  });
}

/** Ripple expand, swap theme under full cover, then dissolve overlay out. */
export function playThemeRipple(
  origin: ThemeRippleOrigin,
  onReveal: () => void,
): Promise<void> {
  if (typeof window === "undefined") {
    onReveal();
    return Promise.resolve();
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onReveal();
    return Promise.resolve();
  }

  const radius = rippleRadius(origin.x, origin.y);
  const diameter = radius * 2;
  const themeColor = THEME_BACKGROUNDS[origin.theme];

  const layer = document.createElement("div");
  layer.className = "theme-ripple-layer";
  layer.setAttribute("aria-hidden", "true");

  const backdrop = document.createElement("div");
  backdrop.className = "theme-ripple-backdrop";
  backdrop.style.background = themeColor;

  const circle = document.createElement("div");
  circle.className = "theme-ripple-circle";
  circle.style.left = `${origin.x}px`;
  circle.style.top = `${origin.y}px`;
  circle.style.width = `${diameter}px`;
  circle.style.height = `${diameter}px`;
  circle.style.background = themeColor;
  circle.style.transform = "translate(-50%, -50%) scale(0)";
  circle.style.opacity = "0";

  layer.append(backdrop, circle);
  document.body.appendChild(layer);

  return nextFrame().then(async () => {
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      onReveal();
    };

    try {
      const expand = circle.animate(
        [
          {
            transform: "translate(-50%, -50%) scale(0)",
            opacity: 0,
            filter: "blur(10px)",
          },
          {
            transform: "translate(-50%, -50%) scale(1)",
            opacity: 1,
            filter: "blur(0px)",
          },
        ],
        {
          duration: EXPAND_MS,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );

      await waitForAnimation(expand);

      // Solid full-screen cover before swap — avoids edge flash during dissolve.
      backdrop.style.opacity = "1";
      reveal();

      await nextFrame();

      const dissolve = layer.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        {
          duration: DISSOLVE_MS,
          easing: "cubic-bezier(0.33, 1, 0.68, 1)",
          fill: "forwards",
        },
      );

      await waitForAnimation(dissolve);
    } finally {
      reveal();
      layer.remove();
    }
  });
}
