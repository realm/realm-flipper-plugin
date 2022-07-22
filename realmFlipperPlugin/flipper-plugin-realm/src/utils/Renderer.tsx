export function renderText(text: any): string {
    let returnText;

    typeof text === "object"
      ? (returnText = JSON.stringify(text))
      : typeof text === "boolean"
      ? (returnText = text.toString())
      : (returnText = text);
    return returnText;
  }