/**
 * Values accepted by the HTML agreement template in public/agreement-template.
 * Keep this map aligned with AgreementData in app/page.tsx.
 */
export type AgreementTemplateValues = Partial<Record<
  | "studentName"
  | "studentId"
  | "wardenName"
  | "wardenId"
  | "startDate"
  | "roomNo"
  | "monthlyRent"
  | "monthlyRentWords"
  | "depositAmount"
  | "depositAmountWords"
  | "hostelTelephone"
  | "hostelEmail", string>>;

const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPE[character]);
}

/**
 * Replaces only known {{field}} tokens and HTML-escapes user-entered values.
 * Unknown tokens are retained so a missing field cannot silently alter the
 * contract wording.
 */
export function renderAgreementTemplate(template: string, values: AgreementTemplateValues): string {
  return template.replace(/\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g, (token, key: keyof AgreementTemplateValues) => {
    if (!(key in values)) return token;
    return escapeHtml(values[key] ?? "");
  });
}

export async function fetchAgreementTemplate(values: AgreementTemplateValues): Promise<string> {
  const response = await fetch("/agreement-template/agreement-template.html", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load the agreement HTML template.");
  return renderAgreementTemplate(await response.text(), values);
}
