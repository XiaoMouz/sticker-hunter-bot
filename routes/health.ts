import { responseBody } from "~/utils/body";

export default eventHandler(() => {
  return responseBody("Working");
});
