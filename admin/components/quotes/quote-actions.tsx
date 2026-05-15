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
    <div className="admin-no-print grid w-full gap-2 rounded-xl border bg-white p-3 shadow-soft sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3 sm:p-4">
      <Button
        type="button"
        onClick={onSave}
        disabled={!canEdit || isSaving}
        className="w-full sm:w-auto"
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save draft"}
      </Button>
      <SendQuoteButton
        onSend={onSend}
        disabled={!canSend}
        isSending={isSending}
        className="w-full sm:w-auto"
      />
      <PrintButton className="w-full sm:w-auto" />
    </div>
  );
}
