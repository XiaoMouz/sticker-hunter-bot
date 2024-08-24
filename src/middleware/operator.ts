import { Context, NarrowedContext } from "telegraf";
import { CallbackQuery, Message, Update } from "telegraf/types";
import { getValue } from "../model/kv";
import { User } from "~/types/user";

export async function verifyOperator<T extends Context>(
  ctx: T,
  next: () => Promise<void>
): Promise<void> {
  const operators = await getValue<User[]>("operators");
  if (operators?.find((o) => o.id === ctx.from?.id)) {
    return next();
  }
  await ctx.reply("你不是管理员，无法执行此操作");
}

export async function verifyAdmin(
  ctx: Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }>,
  next: () => Promise<void>
) {
  const adminIds = await getValue<number[]>("admin_ids");
  if (adminIds?.includes(ctx.from.id)) {
    return next();
  }
  return ctx.reply("你不是管理员，无法执行此操作");
}
