import type { Locale } from "./config";

export type Messages = typeof import("./messages/en.json");

export async function getMessages(locale: Locale): Promise<Messages> {
  const messages = await import(`./messages/${locale}.json`);
  return messages.default as Messages;
}
