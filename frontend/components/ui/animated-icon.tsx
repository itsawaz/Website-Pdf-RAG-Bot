"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedIconProps {
  icon: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon,
  className,
  animate = true,
}) => {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={animate ? {
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
    >
      {icon}
    </motion.div>
  );
};
