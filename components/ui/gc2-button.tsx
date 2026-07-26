import Link, { type LinkProps } from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type Gc2ButtonVariant =
  | "primary"
  | "secondary"
  | "quiet"
  | "danger";

const variantClass: Record<Gc2ButtonVariant, string> = {
  primary: "gc2-button-primary",
  secondary: "gc2-button-secondary",
  quiet: "gc2-button-quiet",
  danger: "gc2-button-danger",
};

type SharedButtonProps = {
  variant?: Gc2ButtonVariant;
  iconOnly?: boolean;
};

export function Gc2Button({
  variant = "primary",
  iconOnly = false,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & SharedButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "gc2-button",
        variantClass[variant],
        iconOnly && "gc2-icon-button",
        className,
      )}
      {...props}
    />
  );
}

type Gc2LinkButtonProps = LinkProps &
  Omit<ComponentPropsWithoutRef<"a">, "href"> &
  SharedButtonProps & {
    children: ReactNode;
  };

export function Gc2LinkButton({
  variant = "primary",
  iconOnly = false,
  className,
  children,
  ...props
}: Gc2LinkButtonProps) {
  return (
    <Link
      className={cn(
        "gc2-button",
        variantClass[variant],
        iconOnly && "gc2-icon-button",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
