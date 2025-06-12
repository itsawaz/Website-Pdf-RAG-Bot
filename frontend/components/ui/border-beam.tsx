"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#3b82f6",
  colorTo = "#8b5cf6",
  delay = 0,
}: BorderBeamProps) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        className
      )}
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
    >      <motion.div
        className="absolute inset-0 rounded-[inherit] [background:linear-gradient(var(--angle),var(--color-from),var(--color-to),transparent,transparent,transparent,transparent,var(--color-from))_border-box] [mask:linear-gradient(#fff_0_0)_padding-box,_linear-gradient(#fff_0_0)_border-box] ![mask-composite:xor] [border:inherit]"
        animate={{
          rotateZ: [0, 360],
        }}
        transition={{
          duration: duration,
          ease: "linear",
          repeat: Infinity,
          delay: delay,
        }}
        style={
          {
            background: `linear-gradient(${0}deg, ${colorFrom}, ${colorTo}, transparent, transparent, transparent, transparent, ${colorFrom})`,
          } as React.CSSProperties
        }
      />
    </div>
  );
};
