"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type SendQuoteButtonProps = {
  disabled?: boolean;
  isSending?: boolean;
  onSend: () => void;
  className?: string;
};

export function SendQuoteButton({
  disabled = false,
  isSending = false,
  onSend,
  className,
}: SendQuoteButtonProps) {
  return (
    <Button
      type="button"
      onClick={onSend}
      disabled={disabled || isSending}
      className={className}
    >
      <Send className="mr-2 h-4 w-4" />
      {isSending ? "Sending..." : "Send quote"}
    </Button>
  );
}
