import { onRequest } from "firebase-functions/v2/https";
import { fetchWillhabenListing } from "./willhaben.mjs";

export const willhabenImport = onRequest({ region: "europe-west3", timeoutSeconds: 15, maxInstances: 3 }, async (request, response) => {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }
  try {
    const listing = await fetchWillhabenListing(String(request.query.url ?? ""));
    response.set("Cache-Control", "public, max-age=300");
    response.json(listing);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The listing could not be loaded.";
    response.status(message.startsWith("Enter a valid") ? 400 : 502).json({ error: message });
  }
});
