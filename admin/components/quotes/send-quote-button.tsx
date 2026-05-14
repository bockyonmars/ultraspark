"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type SendQuoteButtonProps = {
  disabled?: boolean;
  isSending?: boolean;
  onSend: () => void;
};

export function SendQuoteButton({
  disabled = false,
  isSending = false,
  onSend,
}: SendQuoteButtonProps) {
  return (
    <Button
      type="button"
      onClick={onSend}
      disabled={disabled || isSending}
    >
      <Send className="mr-2 h-4 w-4" />
      {isSending ? "Sending..." : "Send quote"}
    </Button>
  );
}
