import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type Props<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function AppCard<T extends ElementType = "section">({ as, children, className = "", ...props }: Props<T>) {
  const Component = as ?? "section";
  return <Component className={`app-card ${className}`.trim()} {...props}>{children}</Component>;
}
