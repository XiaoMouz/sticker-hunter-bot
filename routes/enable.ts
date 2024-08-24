import process from "node:process";
import { bot } from "../src";
import { responseBody } from "~/utils/body";

const SECRET_HASH: string = process.env.SECRET_HASH || "NOT_SET";

export default eventHandler(async (event) => {
  const query = getQuery(event);

  if (query.setWebhook === "true") {
    const host =
      getRequestHeader(event, "x-forwarded-host") || getRequestHost(event);
    const webhookUrl = `https://${host}/endpoint?secret_hash=${SECRET_HASH}`;
    const isSet = await bot.telegram.setWebhook(webhookUrl);
    const info = await bot.telegram.getWebhookInfo();

    return responseBody(
      `Set webhook to ${webhookUrl.replaceAll(
        SECRET_HASH,
        "*"
      )}: ${isSet}<br/>${JSON.stringify(info).replaceAll(SECRET_HASH, "*")}`
    );
  } else if (query.setWebhook === false && query.secret_hash === SECRET_HASH) {
    const isSet = await bot.telegram.deleteWebhook();
    return responseBody(`Delete webhook: ${isSet}`);
  }

  setResponseStatus(event, 403, "Forbidden");
  return responseBody("Request Forbidden", 403, "Failed");
});
