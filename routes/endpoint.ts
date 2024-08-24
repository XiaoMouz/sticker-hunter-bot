import process from "node:process";
import { bot } from "../src/index";
import { responseBody } from "~/utils/body";

const SECRET_HASH: string = process.env.SECRET_HASH || "NOT_SET";

export default eventHandler(async (event) => {
  const query = getQuery(event);
  if (query.secret_hash != SECRET_HASH) {
    setResponseStatus(event, 403, "Forbidden");
    return responseBody("Forbidden", 403, "Failed");
  }

  const body = await readBody(event);
  await bot.handleUpdate(body);
  return responseBody("Handled");
});
