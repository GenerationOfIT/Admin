import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-bold disabled:cursor-default disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-ink",
        secondary: "border-border hover:border-primary border",
        danger: "text-danger border border-current",
        ghost: "text-muted hover:text-foreground",
      },
      size: {
        sm: "px-3 py-1 text-sm",
        md: "px-5 py-2",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
