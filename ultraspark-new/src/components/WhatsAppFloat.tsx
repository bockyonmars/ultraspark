import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { CONTACT } from "@/lib/constants";

export function WhatsAppFloat() {
  return (
    <a
      href={CONTACT.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with UltraSpark on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant transition-transform hover:scale-110 sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
