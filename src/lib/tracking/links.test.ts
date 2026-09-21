import { describe, expect, it } from "vitest";
import { TRACKING_PARAMS } from "./utm";
import { buildTrackedHref, forwardTracking } from "./links";

function paramsOf(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("forwardTracking", () => {
  it("repassa todos os parâmetros declarados em TRACKING_PARAMS", () => {
    const query = TRACKING_PARAMS.map((param) => `${param}=valor-${param}`).join(
      "&",
    );
    const out = forwardTracking(paramsOf(query));

    for (const param of TRACKING_PARAMS) {
      expect(out.get(param)).toBe(`valor-${param}`);
    }
  });

  it("descarta parâmetros que não estão em TRACKING_PARAMS", () => {
    const out = forwardTracking(paramsOf("utm_source=google&foo=bar"));

    expect(out.get("utm_source")).toBe("google");
    expect(out.has("foo")).toBe(false);
  });

  it("descarta um `time` vindo da query de entrada", () => {
    const out = forwardTracking(paramsOf("utm_source=google&time=c"));

    expect(out.get("utm_source")).toBe("google");
    expect(out.has("time")).toBe(false);
  });

  it("devolve vazio quando não há nenhum parâmetro de rastreamento", () => {
    const out = forwardTracking(paramsOf(""));
    expect(out.toString()).toBe("");
  });
});

describe("buildTrackedHref", () => {
  it("monta caminho interno sem query quando não há tracking nem extra", () => {
    expect(buildTrackedHref("/adic-25", paramsOf(""))).toBe("/adic-25");
  });

  it("anexa as UTMs a um caminho interno", () => {
    const href = buildTrackedHref(
      "/adic-25",
      paramsOf("utm_source=instagram&utm_medium=cpc"),
    );
    expect(href).toBe("/adic-25?utm_source=instagram&utm_medium=cpc");
  });

  it("anexa as UTMs a uma URL absoluta externa", () => {
    const href = buildTrackedHref(
      "https://previdenciario.bmzadvogados.adv.br/",
      paramsOf("utm_source=instagram&utm_campaign=inss_acidente"),
    );
    expect(href).toBe(
      "https://previdenciario.bmzadvogados.adv.br/?utm_source=instagram&utm_campaign=inss_acidente",
    );
  });

  it("acrescenta os parâmetros extras junto das UTMs", () => {
    const href = buildTrackedHref(
      "/aux-acidente",
      paramsOf("utm_source=instagram"),
      { time: "b" },
    );
    expect(href).toBe("/aux-acidente?utm_source=instagram&time=b");
  });

  it("extra sobrescreve um valor de tracking com a mesma chave", () => {
    const href = buildTrackedHref("/x", paramsOf("utm_source=google"), {
      utm_source: "override",
    });
    expect(href).toBe("/x?utm_source=override");
  });

  it("usa & quando o target já tem query própria", () => {
    const href = buildTrackedHref(
      "/x?foo=1",
      paramsOf("utm_source=google"),
    );
    expect(href).toBe("/x?foo=1&utm_source=google");
  });

  it("faz URL-encode de valores com espaço e acento", () => {
    const href = buildTrackedHref(
      "/adic-25",
      paramsOf("utm_campaign=" + encodeURIComponent("ação inss")),
    );
    expect(href).toBe("/adic-25?utm_campaign=a%C3%A7%C3%A3o+inss");
  });
});
