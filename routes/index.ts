import { responseBody } from "~/utils/body";

export default eventHandler(async (evt) => {
  const storage = useStorage("kv");
  const hasKeys = (await storage.getKeys()).length;
  const query = getQuery(evt);
  if (!hasKeys || query.reset) {
    await storage.setItem("admin_ids", [630759526, 686421524]);
    await storage.setItem("block_stickers", [
      "spottedhyenaNL",
      "FriendlyHyena",
    ]);
    await storage.setItem("block_username_keywords", [
      "免费vpn",
      "免费 vpn",
      "免费v2ray",
      "免费ssr",
      "免费ss",
      "免费梯子",
      "无需翻墙电报",
      "免费使用",
    ]);
    await storage.setItem("disable_join_check", false);
  
    await storage.setItem("operators", [
      {
        name: "Rimo",
        id: 686421524,
        username: "RimoOvO",
      },
      {
        name: "XiaoMouz",
        id: 630759526,
        username: "XiaoMouz",
      },
      {
        name: "Kevin",
        id: 427330603,
        username: "sanxiaozhizi",
      },
      {
        name: "QPomelo",
        id: 893728412,
        username: "qpomelo",
      },
      {
        name: "寧 Nei",
        id: 1371610827,
        username: "Neiko_XoX",
      },
    ]);
  }

  const keys = await storage.getKeys();
  const result = await storage.getItems(keys);

  return responseBody(result);
});
