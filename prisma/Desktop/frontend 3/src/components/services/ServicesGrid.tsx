import { ReactNode } from "react";

type ServicesGridProps = {
  children: ReactNode;
};

export function ServicesGrid({ children }: ServicesGridProps) {
  return <div className="framer-services-list">{children}</div>;
}
