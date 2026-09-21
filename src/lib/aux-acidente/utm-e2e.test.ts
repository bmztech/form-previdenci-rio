import { beforeEach, describe, expect, it } from "vitest";
import { readTracking } from "../tracking/utm";
import { buildWhatsAppUrl } from "./whatsapp";

function setUrl(url: string) {
  window.history.pushState({}, "", url);
}

beforeEach(() => {
  sessionStorage.clear();
  setUrl("http://localhost/");
});

describe("e2e — UTMs da URL chegam na mensagem final do WhatsApp (aux-acidente)", () => {
  it("de /aux-a?utm_source=instagram&utm_medium=cpc&utm_campaign=inss_acidente até o texto do wa.me", () => {
    setUrl(
      "http://localhost/aux-a?utm_source=instagram&utm_medium=cpc&utm_campaign=inss_acidente",
    );

    const tracking = readTracking();
    const url = buildWhatsAppUrl({}, tracking, "554268235828");
    const text = decodeURIComponent(url.split("?text=")[1]);

    const origem = text.slice(text.indexOf("— origem —"));
    expect(origem).toContain("utm_source: instagram");
    expect(origem).toContain("utm_medium: cpc");
    expect(origem).toContain("utm_campaign: inss_acidente");
  });
});
