import { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export default function AnimatedButton({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}: AnimatedButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}
