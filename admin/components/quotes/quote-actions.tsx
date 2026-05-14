"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "./print-button";
import { SendQuoteButton } from "./send-quote-button";

type QuoteActionsProps = {
  canEdit?: boolean;
  canSend?: boolean;
  isSaving?: boolean;
  isSending?: boolean;
  onSave: () => void;
  onSend: () => void;
};

export function QuoteActions({
  canEdit = true,
  canSend = true,
  isSaving = false,
  isSending = false,
  onSave,
  onSend,
}: QuoteActionsProps) {
  return (
    <div className="admin-no-print flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-soft">
      <Button
        type="button"
        onClick={onSave}
        disabled={!canEdit || isSaving}
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save draft"}
      </Button>
      <SendQuoteButton
        onSend={onSend}
        disabled={!canSend}
        isSending={isSending}
      />
      <PrintButton />
    </div>
  );
}
