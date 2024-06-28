import process from "node:process";
import { Telegraf } from "telegraf";
import { message, callbackQuery } from "telegraf/filters";
import { getValue, setValue } from "./model/kv";
import {
  getDeleteMessage,
  getBannedMessage,
  escapeMarkdown,
  getDeleteStickerInlineKeyboard,
  getUsernameKeywordInlineKeyboard,
} from "./utils/ctx";
import { verifyAdmin, verifyOperator } from "./middleware/operator";
import { User } from "~/types/user";

const BOT_TOKEN = process.env.BOT_TOKEN!;
export const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply("退钱！"));
bot.help((ctx) => ctx.reply("你是不是看错了什么"));

// bot command
bot.command("new_member_check", async (ctx) => {
  const status = await getValue<boolean>("disable_join_check");
  if (status) {
    return ctx.reply("👩‍🦼已关闭新成员检查", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "👯开启新成员检查",
              callback_data: "enable_join_check",
            },
          ],
        ],
      },
    });
  }
  return ctx.reply("👮已开启新成员检查", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🏃‍♂️关闭新成员检查",
            callback_data: "disable_join_check",
          },
        ],
      ],
    },
  });
});
bot.command("block_stickers", async (ctx) => {
  const stickerList = await getValue<string[]>("block_stickers");
  let text = "当前被屏蔽的贴纸集合:\n";
  for (const sticker of stickerList || []) {
    text += escapeMarkdown(
      `- [${sticker}](https://t.me/addstickers/${sticker})\n`,
      "[]()"
    );
  }
  await ctx.replyWithMarkdownV2(text, {
    link_preview_options: {
      is_disabled: true,
    },
  });
});
bot.command("block_username_keywords", async (ctx) => {
  const bannedKeywords = await getValue<string[]>("block_username_keywords");
  let text = "当前被屏蔽的用户名关键词:\n";
  for (const keyword of bannedKeywords || []) {
    text += escapeMarkdown(`- ${keyword}\n`);
  }
  await ctx.replyWithMarkdownV2(text);
});
bot.command("add_block_sticker", verifyOperator, async (ctx) => {
  const message = ctx.message;
  let sticker: string | undefined;
  if (message.reply_to_message && "sticker" in message.reply_to_message) {
    sticker = message.reply_to_message.sticker.set_name;
    await ctx
      .deleteMessage(message.reply_to_message.message_id)
      .catch(() => false);
  } else {
    sticker = message.text.split(" ")[1];
  }
  if (!sticker) {
    return ctx.reply("请回复一个贴纸或者提供一个贴纸集合名");
  }
  const stickerList = (await getValue<string[]>("block_stickers")) || [];
  stickerList.push(sticker);
  await setValue("block_stickers", [...new Set(stickerList)]);
  return ctx.replyWithMarkdownV2(
    escapeMarkdown(
      `已屏蔽贴纸集合:[${sticker}](https://t.me/addstickers/${sticker})`,
      "[]()"
    ),
    {
      link_preview_options: {
        is_disabled: true,
      },
    }
  );
});
bot.command("remove_block_sticker", verifyOperator, async (ctx) => {
  const stickers = (await getValue<string[]>("block_stickers")) || [];
  ctx.replyWithMarkdownV2("选择要删除的贴纸包", {
    reply_markup: {
      inline_keyboard: await getDeleteStickerInlineKeyboard(),
    },
  });
});
bot.command("add_block_username_keyword", verifyOperator, async (ctx) => {
  const keyword = ctx.message.text.split(" ")[1];
  if (!keyword) {
    return ctx.reply("请提供一个用户名关键词");
  }
  const bannedKeywords =
    (await getValue<string[]>("block_username_keywords")) || [];
  bannedKeywords.push(keyword);
  await setValue("block_username_keywords", [...new Set(bannedKeywords)]);
  return ctx.reply(`已屏蔽用户名关键词: ${keyword}`);
});
bot.command("remove_username_block_keyword", verifyOperator, async (ctx) => {
  const text = "选择要删除的用户名关键词";

  await ctx.replyWithMarkdownV2(text, {
    reply_markup: {
      inline_keyboard: await getUsernameKeywordInlineKeyboard(),
    },
  });
});
bot.command("operators", async (ctx) => {
  const operators = (await getValue<User[]>("operators")) || [];
  let text = "当前管理员列表:\n";
  for (const operator of operators) {
    text += escapeMarkdown(
      `- [${
        operator.username ? "@" + operator.username : operator.name
      }](tg://user?id=${operator.id})\n`,
      "[]()"
    );
  }
  await ctx.replyWithMarkdownV2(text, {
    link_preview_options: {
      is_disabled: true,
    },
  });
});
bot.command("add_operator", verifyAdmin, async (ctx) => {
  const message = ctx.message;
  let userId: number | undefined;
  let fullName: string | undefined;
  let username: string | undefined;
  if (message.reply_to_message) {
    userId = message.reply_to_message.from?.id;
    fullName =
      (message.reply_to_message.from?.first_name || "") +
      (message.reply_to_message.from?.last_name || "");
    username = message.reply_to_message.from?.username;
  }
  if (!userId) {
    return ctx.reply("请回复一个用户");
  }
  const operatorIds = (await getValue<User[]>("operators")) || [];
  operatorIds.push({
    id: userId,
    username: username,
    name: fullName,
  });
  await setValue("operator_ids", [...new Set(operatorIds)]);
  return ctx.replyWithMarkdownV2(
    `已添加用户[${fullName}](tg://user?id=${userId})为管理员`
  );
});
bot.command("remove_operator", verifyAdmin, async (ctx) => {
  const operators = (await getValue<User[]>("operators")) || [];
  let text = "选择要删除的管理员";
  const buttons = operators.map((operator) => {
    return [
      {
        text: operator.username ? "@" + operator.username : operator.name || "",
        callback_data: `remove_operator|${operator.id}`,
      },
    ];
  });
  await ctx.replyWithMarkdownV2(text, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
});

bot.on(callbackQuery("data"), async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data === "remove_all_block_sticker") {
    await setValue("block_stickers", []);
    await ctx.answerCbQuery("已删除所有贴纸包");
    await ctx.editMessageReplyMarkup({
      inline_keyboard: await getDeleteStickerInlineKeyboard(),
    });
    return;
  }
  if (data.startsWith("remove_block_sticker")) {
    const sticker = data.split("|")[1];
    const stickers = (await getValue<string[]>("block_stickers")) || [];
    const newStickers = stickers.filter((s) => s !== sticker);
    await setValue("block_stickers", newStickers);
    await ctx.answerCbQuery("已删除贴纸包" + sticker);
    await ctx.editMessageReplyMarkup({
      inline_keyboard: await getDeleteStickerInlineKeyboard(),
    });
    return;
  }
  if (data === "remove_all_block_keyword") {
    await setValue("block_username_keywords", []);
    await ctx.answerCbQuery("已删除所有关键词");
    await ctx.editMessageReplyMarkup({
      inline_keyboard: await getUsernameKeywordInlineKeyboard(),
    });
    return;
  }
  if (data.startsWith("remove_block_user_keyword")) {
    const keyword = data.split("|")[1];
    const keywords =
      (await getValue<string[]>("block_username_keywords")) || [];
    const newKeywords = keywords.filter((k) => k !== keyword);
    await setValue("block_username_keywords", newKeywords);
    await ctx.answerCbQuery("已删除关键词" + keyword);
    await ctx.editMessageReplyMarkup({
      inline_keyboard: await getUsernameKeywordInlineKeyboard(),
    });
    return;
  }
  if (data.startsWith("remove_operator")) {
    const userId = parseInt(data.split("|")[1]);
    const operators = (await getValue<User[]>("operators")) || [];
    const newOperators = operators.filter((o) => o.id !== userId);
    await setValue("operators", newOperators);
    await ctx.answerCbQuery("已删除管理员");
    const buttons = newOperators.map((operator) => {
      return [
        {
          text: operator.username
            ? "@" + operator.username
            : operator.name || "",
          callback_data: `remove_operator|${operator.id}`,
        },
      ];
    });
    await ctx.editMessageReplyMarkup({
      inline_keyboard: buttons,
    });
    return;
  }
  if (data.startsWith("enable_join_check")) {
    const operators = await getValue<User[]>("operators");
    if (!operators?.find((o) => o.id === ctx.from.id)) {
      return ctx.answerCbQuery("你不是管理员，无法执行此操作");
    }
    await setValue("disable_join_check", false);
    await ctx.answerCbQuery("已开启新成员检查");
    await ctx.editMessageText("👮已开启新成员检查");
    await ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [
          {
            text: "🏃‍♂️关闭新成员检查",
            callback_data: "disable_join_check",
          },
        ],
      ],
    });
    return;
  }
  if (data.startsWith("disable_join_check")) {
    const operators = await getValue<User[]>("operators");
    if (!operators?.find((o) => o.id === ctx.from.id)) {
      return ctx.answerCbQuery("你不是管理员，无法执行此操作");
    }
    await setValue("disable_join_check", true);
    await ctx.answerCbQuery("已关闭新成员检查");
    await ctx.editMessageText("👩‍🦼已关闭新成员检查");
    await ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [
          {
            text: "👯开启新成员检查",
            callback_data: "enable_join_check",
          },
        ],
      ],
    });
    return;
  }
  return;
});

bot.on(message("sticker"), async (ctx) => {
  const stickerList = await getValue<string[]>("block_stickers");
  if (!stickerList) return;
  for (const sticker of stickerList) {
    if (ctx.message?.sticker?.set_name === sticker) {
      await ctx.deleteMessage().catch(() => false);
      const text = getDeleteMessage(ctx);
      await ctx.sendMessage(text, {
        parse_mode: "MarkdownV2",
        link_preview_options: {
          is_disabled: true,
        },
      });
      return;
    }
  }
});
bot.on(message("new_chat_members"), async (ctx) => {
  const message = ctx.message;
  const disableJoinCheck = await getValue<boolean>("disable_join_check");
  if (disableJoinCheck) return;
  const bannedKeywords = await getValue<string[]>("block_username_keywords");
  if (!bannedKeywords) return;
  for (const keyword of bannedKeywords) {
    for (const new_chat_member of message.new_chat_members) {
      if (
        new_chat_member.username?.includes(keyword) ||
        new_chat_member.first_name?.includes(keyword) ||
        new_chat_member.last_name?.includes(keyword)
      ) {
        await ctx.banChatMember(new_chat_member.id);
        const text = getBannedMessage(
          new_chat_member.first_name + new_chat_member.last_name,
          new_chat_member.id
        );
        await ctx.sendMessage(text, {
          parse_mode: "MarkdownV2",
          link_preview_options: {
            is_disabled: true,
          },
        });
        return;
      }
    }
  }
});
bot.on(message("left_chat_member"), async (ctx) => {
  if (ctx.message.from.id === 7127605463) {
    ctx.deleteMessage().catch(() => false);
    return;
  }
});
