"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type PrintButtonProps = {
  disabled?: boolean;
};

export function PrintButton({ disabled = false }: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.print()}
      disabled={disabled}
    >
      <Printer className="mr-2 h-4 w-4" />
      Print / PDF
    </Button>
  );
}
