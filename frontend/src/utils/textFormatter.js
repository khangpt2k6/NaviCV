export const formatJobDescription = (description) => {
  if (!description) return "";

  let formatted = description;

  formatted = formatted
    .replace(/Â /g, ' ')
    .replace(/Â/g, '')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, '—')
    .replace(/â€"/g, '–')
    .replace(/â€¦/g, '…')
    .replace(/â€"/g, '™')
    .replace(/â€™/g, "'")
    .replace(/â€"/g, '"')
    .replace(/â€"/g, '"')
    .replace(/â€™s/g, "'s")
    .replace(/â€™t/g, "'t")
    .replace(/â€™ll/g, "'ll")
    .replace(/â€™ve/g, "'ve")
    .replace(/â€™re/g, "'re")
    .replace(/â€™m/g, "'m")
    .replace(/â€™d/g, "'d")
    .replace(/([a-z])orldâ€™s/gi, "$1orld's")
    .replace(/orldâ€™s/gi, "world's")
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã¡/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã'/g, 'Ñ')
    .replace(/â€™/g, "'")
    .replace(/â€"/g, '"')
    .replace(/â€"/g, '"');

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
  html = html.replace(/\n/g, "<br>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/<b>(.*?)<\/b>/gi, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/<i>(.*?)<\/i>/gi, "<em>$1</em>");
  html = html.replace(
    /^• /gm,
    '<span class="inline-block w-2 h-2 bg-slate-400 rounded-full mr-2 mt-2"></span>'
  );

  return html;
};


