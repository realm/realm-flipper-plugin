export function renderText(text: any): string {
  if (text.hasOwnProperty("$numberDecimal")) {
    return text.$numberDecimal;
  }

  switch (typeof text) {
    case "object":
      return JSON.stringify(text);
    case "boolean":
      return text.toString();
    default:
      return text;
  }
}
