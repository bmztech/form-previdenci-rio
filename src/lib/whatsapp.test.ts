import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRACKING_PARAMS, WHATSAPP_NUMBER, WHATSAPP_NUMBERS } from "./config";
import type { Answers } from "./form";
import { buildMessage, buildWhatsAppUrl, readTracking } from "./whatsapp";

function setUrl(url: string) {
  window.history.pushState({}, "", url);
}

function setReferrer(value: string) {
  Object.defineProperty(document, "referrer", {
    value,
    configurable: true,
  });
}

beforeEach(() => {
  sessionStorage.clear();
  setUrl("http://localhost/");
  setReferrer("");
});

describe("readTracking", () => {
  it("captura todos os campos utm_* presentes na URL", () => {
    setUrl(
      "http://localhost/?utm_source=google&utm_medium=cpc&utm_campaign=promo&utm_content=banner&utm_term=advogado"
    );

    const tracking = readTracking();

    expect(tracking.utm_source).toBe("google");
    expect(tracking.utm_medium).toBe("cpc");
    expect(tracking.utm_campaign).toBe("promo");
    expect(tracking.utm_content).toBe("banner");
    expect(tracking.utm_term).toBe("advogado");
  });

  it("captura fbclid e gclid junto com as UTMs", () => {
    setUrl("http://localhost/?fbclid=abc123&gclid=xyz789");

    const tracking = readTracking();

    expect(tracking.fbclid).toBe("abc123");
    expect(tracking.gclid).toBe("xyz789");
  });

  it("não preenche campos de rastreamento ausentes na URL", () => {
    setUrl("http://localhost/?utm_source=google");

    const tracking = readTracking();

    expect(tracking.utm_source).toBe("google");
    expect(tracking.utm_medium).toBeUndefined();
    expect(tracking.fbclid).toBeUndefined();
  });

  it("cobre todos os parâmetros declarados em TRACKING_PARAMS", () => {
    const query = TRACKING_PARAMS.map((param) => `${param}=valor-${param}`).join(
      "&"
    );
    setUrl(`http://localhost/?${query}`);

    const tracking = readTracking();

    for (const param of TRACKING_PARAMS) {
      expect(tracking[param]).toBe(`valor-${param}`);
    }
  });

  it("persiste as UTMs capturadas no sessionStorage", () => {
    setUrl("http://localhost/?utm_source=google&utm_medium=cpc");
    readTracking();

    const stored = JSON.parse(sessionStorage.getItem("bmz_tracking") ?? "{}");
    expect(stored.utm_source).toBe("google");
    expect(stored.utm_medium).toBe("cpc");
  });

  it("recupera UTMs salvas quando a página seguinte não as traz mais na URL", () => {
    setUrl("http://localhost/?utm_source=google&utm_campaign=promo");
    readTracking();

    setUrl("http://localhost/checkout");
    const tracking = readTracking();

    expect(tracking.utm_source).toBe("google");
    expect(tracking.utm_campaign).toBe("promo");
  });

  it("sobrescreve uma UTM salva quando a URL atual traz um novo valor", () => {
    setUrl("http://localhost/?utm_source=google");
    readTracking();

    setUrl("http://localhost/?utm_source=facebook");
    const tracking = readTracking();

    expect(tracking.utm_source).toBe("facebook");
  });

  it("registra o referrer apenas na primeira visita", () => {
    setReferrer("https://instagram.com/");
    setUrl("http://localhost/?utm_source=google");
    const first = readTracking();
    expect(first.referrer).toBe("https://instagram.com/");

    setReferrer("https://outro-site.com/");
    setUrl("http://localhost/pagina-2");
    const second = readTracking();
    expect(second.referrer).toBe("https://instagram.com/");
  });

  it("registra a landing_page a partir da URL da primeira visita", () => {
    setUrl("http://localhost/lp/campanha?utm_source=google");
    const tracking = readTracking();
    expect(tracking.landing_page).toBe("http://localhost/lp/campanha");
  });

  it("não lança erro quando o sessionStorage está indisponível", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

    setUrl("http://localhost/?utm_source=google");
    expect(() => readTracking()).not.toThrow();

    setItemSpy.mockRestore();
  });
});

describe("buildMessage — bloco de origem com UTMs", () => {
  const answers: Answers = {};

  it("inclui o bloco de origem quando há UTMs com valor", () => {
    const message = buildMessage(answers, {
      utm_source: "google",
      utm_medium: "cpc",
    });

    expect(message).toContain("— origem —");
    expect(message).toContain("utm_source: google");
    expect(message).toContain("utm_medium: cpc");
  });

  it("omite o bloco de origem quando não há tracking", () => {
    const message = buildMessage(answers, {});
    expect(message).not.toContain("— origem —");
  });

  it("filtra campos de tracking com valor vazio", () => {
    const message = buildMessage(answers, {
      utm_source: "google",
      utm_medium: "",
    });

    expect(message).toContain("utm_source: google");
    expect(message).not.toContain("utm_medium:");
  });
});

describe("buildWhatsAppUrl — número de destino por unidade", () => {
  const answers: Answers = {};

  it("usa o WHATSAPP_NUMBER padrão quando nenhum número é informado", () => {
    const url = buildWhatsAppUrl(answers, {});
    expect(url).toBe(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(answers, {}))}`,
    );
  });

  it("usa o número informado para cada unidade (aux-a/b/c)", () => {
    expect(buildWhatsAppUrl(answers, {}, WHATSAPP_NUMBERS.a)).toContain(
      `https://wa.me/${WHATSAPP_NUMBERS.a}?`,
    );
    expect(buildWhatsAppUrl(answers, {}, WHATSAPP_NUMBERS.b)).toContain(
      `https://wa.me/${WHATSAPP_NUMBERS.b}?`,
    );
    expect(buildWhatsAppUrl(answers, {}, WHATSAPP_NUMBERS.c)).toContain(
      `https://wa.me/${WHATSAPP_NUMBERS.c}?`,
    );
  });

  it("os três números das unidades são distintos", () => {
    const values = Object.values(WHATSAPP_NUMBERS);
    expect(new Set(values).size).toBe(values.length);
  });
});
