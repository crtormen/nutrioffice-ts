import * as SliderPrimitive from "@radix-ui/react-slider";
import { Circle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showTooltip?: boolean;
  interval?: number;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, onValueChange, showTooltip = true, ...props }, ref) => {
  const [showTooltipState, setShowTooltipState] = React.useState(false);
  const [value, setValue] = React.useState<number[]>(
    (props.defaultValue as number[]) ?? (props.value as number[]) ?? [0],
  );
  const [innerInterval] = React.useState<number>(
    props.interval ?? props.step ?? 25,
  );
  const numberOfMarks = Math.floor(props.max ?? 100 / innerInterval) + 1;
  const marks = Array.from(
    { length: numberOfMarks },
    (_, i) => i * innerInterval,
  );

  function tickIndex(value: number): number {
    // Calculate the index based on the value
    return Math.floor(value / innerInterval);
  }

  function calculateTickPercent(index: number, max: number): number {
    // Calculate the percentage from left of the slider's width
    const percent = ((index * innerInterval) / max) * 100;
    return percent;
  }

  function handleValueChange(v: number[]) {
    setValue(v);
    if (onValueChange) onValueChange(v);
  }

  const handlePointerDown = () => {
    setShowTooltipState(true);
  };

  const handlePointerUp = () => {
    setShowTooltipState(false);
  };

  React.useEffect(() => {
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      onValueChange={handleValueChange}
      onPointerDown={handlePointerDown}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        {marks.map((_, i) => (
          <Circle
            id={`${i}`}
            key={`${i}`}
            role="presentation"
            className={cn(
              "absolute -top-1 -z-10 h-5 w-5 rounded-full text-sm",
              {
                " bg-secondary text-secondary": i > tickIndex(value[0]!),
                "bg-primary text-primary": i <= tickIndex(value[0]!),
              },
            )}
            style={{
              left: `${calculateTickPercent(i, props.max ?? 100)}%`,
              translate: `-${calculateTickPercent(i, props.max ?? 100)}%`,
            }}
            strokeWidth="3px"
            size="48"
          />
        ))}
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <TooltipProvider>
        <Tooltip open={showTooltip && showTooltipState}>
          <TooltipTrigger asChild>
            <SliderPrimitive.Thumb
              className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
              onMouseEnter={() => setShowTooltipState(true)}
              onMouseLeave={() => setShowTooltipState(false)}
            >
              {!showTooltip && (
                <div className="absolute left-1/2 top-7 h-8 w-fit -translate-x-1/2 rounded-md bg-primary p-2 text-center text-xs font-medium text-primary-foreground">
                  {value[0] || 0}%
                </div>
              )}
            </SliderPrimitive.Thumb>
          </TooltipTrigger>
          <TooltipContent className="mb-1 w-auto p-2">
            <p className="font-medium">{value[0]}%</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
