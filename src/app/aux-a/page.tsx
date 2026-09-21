import Funnel from "@/components/Funnel";
import { WHATSAPP_NUMBERS } from "@/lib/aux-acidente/config";

export default function Page() {
  return <Funnel whatsappNumber={WHATSAPP_NUMBERS.a} />;
}
