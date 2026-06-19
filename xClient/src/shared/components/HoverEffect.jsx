import { cn } from "../utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

export const HoverEffect = ({
  items,
  className,
}) => {
  let [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-6",
        className
      )}
    >
      {items.map((item, idx) => (
        <Link
          to={item?.link}
          key={item?.link}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-neutral-200/50 block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.1 },
                }}
              />
            )}
          </AnimatePresence>
          <div className="rounded-2xl h-full w-full p-6 overflow-hidden bg-white border border-neutral-200 group-hover:border-neutral-900 transition-all duration-300 relative z-20 flex flex-col justify-between">
            <div className="relative z-50">
              <h4 className="text-black font-bold tracking-wide mt-2 uppercase text-sm">
                {item.title}
              </h4>
              <p className="mt-3 text-neutral-500 tracking-wide leading-relaxed text-xs">
                {item.description}
              </p>
            </div>
            {item.badge && (
              <span className="mt-4 text-[9px] tracking-[0.2em] font-semibold border border-neutral-200 text-neutral-600 px-2.5 py-1 uppercase w-fit rounded bg-neutral-50">
                {item.badge}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};
