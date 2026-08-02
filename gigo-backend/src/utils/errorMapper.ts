export function mapErrorResponse(error: any, fallbackMsg: string) {
  const msg = error?.message || String(error);
  let statusCode = 500;
  let errorTitle = fallbackMsg;

  if (
    msg.includes("Missing Gemini API Key") ||
    msg.includes("API key not configured") ||
    msg.includes("API key first") ||
    msg.includes("Settings first")
  ) {
    statusCode = 400;
    errorTitle = "Missing Gemini API Key";
  } else if (
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API key not valid") ||
    msg.includes("not authorized") ||
    msg.includes("invalid key") ||
    msg.includes("key is invalid")
  ) {
    statusCode = 401;
    errorTitle = "Invalid Gemini API Key";
  } else if (
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Quota exceeded") ||
    msg.includes("429") ||
    msg.includes("limit")
  ) {
    statusCode = 429;
    errorTitle = "Gemini API Quota Exhausted";
  }

  return { statusCode, error: errorTitle, details: msg };
}
