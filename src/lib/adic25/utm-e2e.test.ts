import { describe, expect, it } from "vitest";
import { readTracking } from "@/lib/tracking/utm";
import { buildWhatsAppUrl } from "@/lib/adic25/whatsapp";

function setUrl(url: string) {
  window.history.pushState({}, "", url);
}

describe("adic-25 UTM end-to-end", () => {
  it("propaga utm_source/utm_medium/utm_campaign da URL até a mensagem final do WhatsApp", () => {
    setUrl(
      "http://localhost/adic-25?utm_source=instagram&utm_medium=cpc&utm_campaign=inss_acidente",
    );

    const tracking = readTracking();

    const url = buildWhatsAppUrl({}, tracking, "554268235828");
    const text = decodeURIComponent(url.split("?text=")[1]);

    expect(text).toContain("— origem —");
    expect(text).toContain("utm_source: instagram");
    expect(text).toContain("utm_medium: cpc");
    expect(text).toContain("utm_campaign: inss_acidente");
  });
});
