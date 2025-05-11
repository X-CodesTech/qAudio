import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  trackClassName?: string
  thumbClassName?: string
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, orientation = "horizontal", trackClassName, thumbClassName, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn(
      orientation === "horizontal" 
        ? "relative flex w-full touch-none select-none items-center" 
        : "relative flex h-full touch-none select-none flex-col items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track 
      className={cn(
        orientation === "horizontal"
          ? "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"
          : "relative w-2 h-full grow overflow-hidden rounded-full bg-secondary",
        trackClassName
      )}
    >
      <SliderPrimitive.Range 
        className={cn(
          orientation === "horizontal"
            ? "absolute h-full bg-red-600"
            : "absolute w-full h-full bg-red-600"
        )} 
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={cn(
      "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      thumbClassName
    )} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
