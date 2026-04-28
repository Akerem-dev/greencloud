"use client";

import { memo, type CSSProperties } from "react";
import { CloudRain, Leaf, Sparkles, Wind } from "lucide-react";
import type { AmbienceMode } from "@/components/providers/app-state-provider";

const LEAVES = Array.from({ length: 38 }).map((_, index) => ({
  left: `${2 + ((index * 7) % 96)}%`,
  top: `${-14 + (index % 8) * 8}%`,
  size: 12 + (index % 7) * 3,
  duration: 7.2 + (index % 6) * 1.15,
  delay: index * 0.26,
  drift: index % 2 === 0 ? 42 : -34,
  opacity: 0.26 + (index % 4) * 0.07,
}));

const RAIN = Array.from({ length: 78 }).map((_, index) => ({
  left: `${1 + ((index * 2.35) % 98)}%`,
  delay: (index % 24) * 0.085,
  duration: 1.05 + (index % 6) * 0.1,
  height: 34 + (index % 8) * 8,
  opacity: 0.24 + (index % 6) * 0.06,
}));

const RAIN_GLASS = Array.from({ length: 16 }).map((_, index) => ({
  left: `${4 + ((index * 6.2) % 92)}%`,
  top: `${8 + ((index * 13) % 78)}%`,
  height: 54 + (index % 5) * 18,
  delay: index * 0.52,
  duration: 5.8 + (index % 4) * 0.8,
}));

const MIST = Array.from({ length: 13 }).map((_, index) => ({
  left: `${-12 + index * 10.5}%`,
  top: `${7 + (index % 5) * 17}%`,
  size: 180 + index * 24,
  delay: index * 0.88,
  duration: 10 + (index % 5) * 1.3,
  opacity: 0.08 + (index % 4) * 0.035,
}));

const WIND = Array.from({ length: 18 }).map((_, index) => ({
  top: `${8 + index * 5.1}%`,
  delay: index * 0.24,
  duration: 4.4 + (index % 5) * 0.7,
  width: 180 + (index % 8) * 42,
  opacity: 0.18 + (index % 5) * 0.055,
}));

const WIND_LEAVES = Array.from({ length: 12 }).map((_, index) => ({
  left: `${-8 - (index % 4) * 5}%`,
  top: `${12 + ((index * 9) % 76)}%`,
  size: 10 + (index % 4) * 3,
  delay: index * 0.42,
  duration: 5.2 + (index % 4) * 0.8,
  rotate: index % 2 === 0 ? 52 : -42,
}));

const FIREFLIES = Array.from({ length: 34 }).map((_, index) => ({
  left: `${4 + ((index * 11) % 92)}%`,
  top: `${10 + ((index * 17) % 78)}%`,
  delay: index * 0.32,
  size: 3 + (index % 4),
  duration: 4.4 + (index % 6) * 0.55,
  x: index % 2 === 0 ? 18 : -16,
  y: index % 3 === 0 ? -22 : 16,
}));

function LeafFallOverlay({ mode = "leaves" }: { mode?: AmbienceMode }) {
  if (mode === "calm") return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      {mode === "leaves" ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_4%,rgba(199,213,91,0.055),transparent_34%)]" />

          {LEAVES.map((leaf, index) => (
            <div
              key={`leaf-${index}`}
              className="absolute text-[#dbe77f] drop-shadow-[0_0_12px_rgba(199,213,91,0.22)]"
              style={
                {
                  left: leaf.left,
                  top: leaf.top,
                  opacity: leaf.opacity,
                  animation: `gc-leaf-drift ${leaf.duration}s linear ${leaf.delay}s infinite`,
                  "--leaf-drift": `${leaf.drift}px`,
                } as CSSProperties
              }
            >
              <Leaf style={{ width: leaf.size, height: leaf.size }} />
            </div>
          ))}
        </>
      ) : null}

      {mode === "rain" ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(142,169,202,0.11),transparent_42%),linear-gradient(180deg,rgba(170,198,225,0.055),transparent_34%,rgba(90,120,150,0.035))]" />

          <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,rgba(255,255,255,0.035)_34%,transparent_52%,rgba(255,255,255,0.026)_71%,transparent_100%)] opacity-70" />

          {RAIN.map((drop, index) => (
            <span
              key={`rain-${index}`}
              className="absolute block w-[1.5px] rounded-full bg-[linear-gradient(180deg,rgba(220,232,255,0),rgba(220,232,255,0.78),rgba(220,232,255,0))]"
              style={{
                left: drop.left,
                top: "-14%",
                height: drop.height,
                opacity: drop.opacity,
                animation: `gc-rain-fall ${drop.duration}s linear ${drop.delay}s infinite`,
              }}
            />
          ))}

          {RAIN_GLASS.map((streak, index) => (
            <span
              key={`rain-glass-${index}`}
              className="absolute w-px rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(228,238,255,0.18),rgba(255,255,255,0))] blur-[0.2px]"
              style={{
                left: streak.left,
                top: streak.top,
                height: streak.height,
                animation: `gc-rain-glass ${streak.duration}s ease-in-out ${streak.delay}s infinite`,
              }}
            />
          ))}

          <CloudRain className="absolute right-[4%] top-[8%] h-7 w-7 text-[#d6e5ff]/45 drop-shadow-[0_0_16px_rgba(214,229,255,0.32)]" />
        </>
      ) : null}

      {mode === "mist" ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_12%,rgba(224,231,207,0.06),transparent_38%)]" />

          {MIST.map((cloud, index) => (
            <div
              key={`mist-${index}`}
              className="absolute rounded-full bg-[radial-gradient(circle,rgba(224,231,207,0.20),rgba(224,231,207,0.065)_48%,transparent_74%)] blur-[36px]"
              style={{
                left: cloud.left,
                top: cloud.top,
                width: cloud.size,
                height: cloud.size * 0.52,
                opacity: cloud.opacity,
                animation: `gc-mist-drift ${cloud.duration}s ease-in-out ${cloud.delay}s infinite`,
              }}
            />
          ))}

          <Wind className="absolute right-[5%] top-[10%] h-6 w-6 text-white/28 drop-shadow-[0_0_14px_rgba(255,255,255,0.14)]" />
        </>
      ) : null}

      {mode === "wind" ? (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent,rgba(214,230,154,0.035),transparent_62%)]" />

          {WIND.map((line, index) => (
            <span
              key={`wind-${index}`}
              className="absolute h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(220,232,168,0.48),rgba(220,232,168,0.18),transparent)] blur-[0.35px]"
              style={{
                top: line.top,
                left: "-24%",
                width: line.width,
                opacity: line.opacity,
                animation: `gc-wind-sweep ${line.duration}s ease-in-out ${line.delay}s infinite`,
              }}
            />
          ))}

          {WIND_LEAVES.map((leaf, index) => (
            <Leaf
              key={`wind-leaf-${index}`}
              className="absolute text-[#dbe77f]/28 drop-shadow-[0_0_12px_rgba(199,213,91,0.16)]"
              style={
                {
                  left: leaf.left,
                  top: leaf.top,
                  width: leaf.size,
                  height: leaf.size,
                  animation: `gc-wind-leaf ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
                  "--wind-leaf-rotate": `${leaf.rotate}deg`,
                } as CSSProperties
              }
            />
          ))}

          <Wind className="absolute right-[5%] top-[10%] h-7 w-7 text-[#dbe77f]/42 drop-shadow-[0_0_16px_rgba(219,231,127,0.24)]" />
        </>
      ) : null}

      {mode === "fireflies" ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(239,241,121,0.06),transparent_38%),radial-gradient(circle_at_80%_84%,rgba(149,196,91,0.05),transparent_36%)]" />

          {FIREFLIES.map((fly, index) => (
            <span
              key={`firefly-${index}`}
              className="absolute rounded-full bg-[#eff179] shadow-[0_0_18px_rgba(239,241,121,0.9),0_0_42px_rgba(239,241,121,0.20)]"
              style={
                {
                  left: fly.left,
                  top: fly.top,
                  width: fly.size,
                  height: fly.size,
                  animation: `gc-firefly ${fly.duration}s ease-in-out ${fly.delay}s infinite`,
                  "--fly-x": `${fly.x}px`,
                  "--fly-y": `${fly.y}px`,
                } as CSSProperties
              }
            />
          ))}

          <Sparkles className="absolute right-[5%] top-[10%] h-7 w-7 text-[#eff179]/42 drop-shadow-[0_0_16px_rgba(239,241,121,0.28)]" />
        </>
      ) : null}

      <style jsx global>{`
        @keyframes gc-leaf-drift {
          0% {
            transform: translate3d(0, -18px, 0) rotate(0deg) scale(0.82);
            opacity: 0;
          }

          8% {
            opacity: 0.72;
          }

          45% {
            transform: translate3d(var(--leaf-drift), 58px, 0) rotate(28deg)
              scale(1);
            opacity: 0.55;
          }

          100% {
            transform: translate3d(calc(var(--leaf-drift) * -0.82), 170px, 0)
              rotate(-34deg) scale(0.76);
            opacity: 0;
          }
        }

        @keyframes gc-rain-fall {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }

          8% {
            opacity: 0.74;
          }

          100% {
            transform: translate3d(-20px, 126vh, 0);
            opacity: 0;
          }
        }

        @keyframes gc-rain-glass {
          0% {
            transform: translate3d(0, -12px, 0);
            opacity: 0;
          }

          25% {
            opacity: 0.55;
          }

          100% {
            transform: translate3d(-10px, 42px, 0);
            opacity: 0;
          }
        }

        @keyframes gc-mist-drift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.36;
          }

          50% {
            transform: translate3d(44px, -14px, 0) scale(1.14);
            opacity: 0.76;
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.36;
          }
        }

        @keyframes gc-wind-sweep {
          0% {
            transform: translate3d(-16vw, 0, 0);
            opacity: 0;
          }

          14% {
            opacity: 0.66;
          }

          58% {
            opacity: 0.32;
          }

          100% {
            transform: translate3d(138vw, -10px, 0);
            opacity: 0;
          }
        }

        @keyframes gc-wind-leaf {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(0.8);
            opacity: 0;
          }

          18% {
            opacity: 0.42;
          }

          100% {
            transform: translate3d(118vw, -20px, 0)
              rotate(var(--wind-leaf-rotate)) scale(1.05);
            opacity: 0;
          }
        }

        @keyframes gc-firefly {
          0% {
            transform: translate3d(0, 0, 0) scale(0.8);
            opacity: 0.12;
          }

          35% {
            transform: translate3d(var(--fly-x), var(--fly-y), 0) scale(1.2);
            opacity: 0.86;
          }

          70% {
            transform: translate3d(
                calc(var(--fly-x) * -0.7),
                calc(var(--fly-y) * 0.55),
                0
              )
              scale(0.95);
            opacity: 0.44;
          }

          100% {
            transform: translate3d(0, 0, 0) scale(0.8);
            opacity: 0.12;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(LeafFallOverlay);