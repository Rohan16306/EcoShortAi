"use client";

import { useEffect, useState } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { tsParticles } from "@tsparticles/engine";
import { useTheme } from "next-themes";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);
  const { resolvedTheme } = useTheme();

  // Initialize tsparticles engine
  useEffect(() => {
    loadSlim(tsParticles).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <Particles
      id="tsparticles"
      className="fixed inset-0 pointer-events-none -z-10"
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "slow",
            },
          },
          modes: {
            slow: {
              factor: 3,
              radius: 200,
            },
          },
        },
        particles: {
          color: {
            value: isDark ? "#4ade80" : "#166534",
          },
          links: {
            color: isDark ? "#22c55e" : "#15803d",
            distance: 150,
            enable: true,
            opacity: 0.2,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: true,
            speed: 0.8,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              width: 800,
              height: 800
            },
            value: 60,
          },
          opacity: {
            value: { min: 0.1, max: 0.4 },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      }}
    />
  );
}
