import { Context, NarrowedContext } from "telegraf";
import { Message, Update } from "telegraf/types";
import { getValue } from "../model/kv";

export function getDeleteMessage(
  ctx: NarrowedContext<
    Context<Update>,
    Update.MessageUpdate<Record<"sticker", {}> & Message.StickerMessage>
  >
) {
  // get sticker name and t.me link
  const message = ctx.message;
  const stickerName = message.sticker.set_name;
  const stickerLink = `https://t.me/addstickers/${stickerName}`;
  const text = escapeMarkdown(
    "出警！ 🚓🚨 发现了一张逆天贴纸 " +
      `: [${stickerName}](${stickerLink})！` +
      "马上逮捕 " +
      `[${
        message.from.username === undefined
          ? " " + message.from.first_name + message.from.last_name
          : "@" + message.from.username
      }](tg://user?id=${message.from.id})` +
      "！",
    "[]()"
  );
  return text;
  // delete sticker
}

export function getBannedMessage(fullName: string, userId: number) {
  const text = `出警！ 🚓🚨 发现了疑似广告机用户:[${escapeMarkdown(
    fullName
  )}](tg://user?id=${userId})！已被封禁！`;
  return text;
}

export async function getDeleteStickerInlineKeyboard() {
  const stickers = (await getValue<string[]>("block_stickers")) || [];
  const buttons = stickers.map((sticker) => {
    return [
      {
        text: sticker,
        callback_data: `remove_block_sticker|${sticker}`,
      },
    ];
  });
  return [
    [
      {
        text: stickers.length > 0 ? "删除所有" : "无贴纸包",
        callback_data:
          stickers.length > 0
            ? "remove_all_block_sticker"
            : "no sticker can remove",
      },
    ],
    ...buttons,
  ];
}

export async function getUsernameKeywordInlineKeyboard() {
  const keywords = (await getValue<string[]>("block_username_keywords")) || [];
  const buttons = keywords.map((keyword) => {
    return [
      {
        text: keyword,
        callback_data: `remove_block_user_keyword|${keyword}`,
      },
    ];
  });
  return [
    [
      {
        text: keywords.length > 0 ? "删除所有" : "无关键词",
        callback_data:
          keywords.length > 0
            ? "remove_all_block_keyword"
            : "no keyword can remove",
      },
    ],
    ...buttons,
  ];
}

export function escapeMarkdown(str: string, except = "") {
  const all = "_*[]()~`>#+-=|{}.!\\"
    .split("")
    .filter((c) => !except.includes(c));
  const regExSpecial = "^$*+?.()|{}[]\\";
  const regEx = new RegExp(
    "[" +
      all.map((c) => (regExSpecial.includes(c) ? "\\" + c : c)).join("") +
      "]",
    "gim"
  );
  return str.replace(regEx, "\\$&");
}
