export const formatJobDescription = (description) => {
  if (!description) return "";

  let formatted = description;

  formatted = formatted.replace(/\\n/g, "\n");

  formatted = formatted.replace(/——¢/g, "•");
  formatted = formatted.replace(/—¢/g, "•");

  formatted = formatted.replace(/(^|\n)\s*â\s+/gm, "$1• ");
  formatted = formatted.replace(/\s+â\s+/g, " → ");

  formatted = formatted.replace(/—s\b/g, "'s");
  formatted = formatted.replace(/—t\b/g, "'t");
  formatted = formatted.replace(/—ll\b/g, "'ll");
  formatted = formatted.replace(/—ve\b/g, "'ve");
  formatted = formatted.replace(/—re\b/g, "'re");
  formatted = formatted.replace(/—m\b/g, "'m");
  formatted = formatted.replace(/—d\b/g, "'d");

  formatted = formatted.replace(/—(\w+)—/g, '"$1"');

  formatted = formatted.replace(/(^|\n)\s*—\s+/gm, "$1• ");

  formatted = formatted.replace(/(\b[A-Z][A-Za-z/]*)\s*—\s*([A-Z][A-Za-z/]*\b)/g, "$1 → $2");

  formatted = formatted
    .replace(/Â ?/g, " ")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, "—")
    .replace(/â€"/g, "–")
    .replace(/â€¦/g, "…")
    .replace(/â€¢/g, "•")
    .replace(/â¢/g, "•")
    .replace(/â€™s/g, "'s")
    .replace(/â€™t/g, "'t")
    .replace(/â€™ll/g, "'ll")
    .replace(/â€™ve/g, "'ve")
    .replace(/â€™re/g, "'re")
    .replace(/â€™m/g, "'m")
    .replace(/â€™d/g, "'d")
    .replace(/([a-z])orldâ€™s/gi, "$1orld's")
    .replace(/orldâ€™s/gi, "world's")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã‰/g, "É")
    .replace(/Ã"/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã'/g, "Ñ")
    .replace(/ð[^\s]*/g, "");

  // Clean any remaining â that wasn't caught (fallback to dash)
  formatted = formatted.replace(/â/g, "—");

  formatted = formatted
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

  formatted = formatted.replace(/<br\s*\/?>/gi, "\n");
  formatted = formatted.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
  formatted = formatted.replace(/<\/?p[^>]*>/gi, "");
  formatted = formatted.replace(/<\/?div[^>]*>/gi, "\n");
  formatted = formatted.replace(/<\/?ul[^>]*>/gi, "\n");
  formatted = formatted.replace(/<\/?ol[^>]*>/gi, "\n");
  formatted = formatted.replace(/<li[^>]*>/gi, "• ");
  formatted = formatted.replace(/<\/li>/gi, "\n");
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  formatted = formatted.trim();

  return formatted;
};

export const createFormattedHTML = (text) => {
  if (!text) return "";

  let html = text;

  const sectionHeaders = [
    "Key Responsibilities",
    "Responsibilities",
    "Accountabilities",
    "What We Offer",
    "What You'll Do",
    "What You'll Get",
    "Skills & Experience",
    "Skills and Experience",
    "Requirements",
    "Required Qualifications",
    "Qualifications",
    "Benefits",
    "Perks",
    "About",
    "About Us",
    "About This Role",
    "About the Role",
    "Job Description",
    "Overview",
    "Additional Information",
    "Additional Details",
    "Company",
    "Location",
    "Salary",
    "Compensation",
    "Why Join Us",
    "Why Join WISEcode",
    "Why Work With Us",
    "What We're Looking For",
    "What We Need",
    "Your Role",
    "The Role",
    "The Opportunity",
    "Position",
    "Opportunity",
    "Details",
    "Summary",
    "Description",
    "How Principal Engineers Operate at WISEcode",
    "AI Skills & Leadership",
  ];

  const escapedHeaders = sectionHeaders.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  
  const headerPattern = new RegExp(
    `(^|\\n)\\s*(${escapedHeaders.join("|")})(:)?\\s*(?=\\n|$)`,
    "gim"
  );

  html = html.replace(headerPattern, (match, prefix, header, colon) => {
    return `${prefix}<div class="mt-6 mb-3"><h4 class="text-lg font-bold text-slate-900 mb-2">${header}${colon || ""}</h4></div>`;
  });

  html = html.replace(/\n/g, "<br>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/<b>(.*?)<\/b>/gi, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/<i>(.*?)<\/i>/gi, "<em>$1</em>");
  html = html.replace(
    /^• /gm,
    '<span class="inline-block w-2 h-2 bg-slate-400 rounded-full mr-2 mt-2"></span>'
  );

  html = html.replace(/(<div[^>]*>)\s*<br>/g, "$1");
  html = html.replace(/<br>\s*(<\/div>)/g, "$1");
  html = html.replace(/<br><br><br>/g, "<br><br>");

  return html;
};
