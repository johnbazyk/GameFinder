import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fox/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-fox text-primary-foreground shadow-card hover:bg-fox-deep",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "bg-transparent hover:bg-muted text-foreground",
        outline:
          "border border-border bg-card text-foreground hover:bg-muted",
        moss: "bg-moss text-cream hover:brightness-110",
        berry: "bg-berry text-cream hover:brightness-110",
      },
      size: {
        sm: "h-9 rounded-[10px] px-3 text-sm",
        md: "h-11 rounded-button px-4 text-sm",
        lg: "h-12 rounded-button px-5 text-base",
        xl: "h-14 rounded-button px-6 text-base",
        icon: "size-11 rounded-button",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
