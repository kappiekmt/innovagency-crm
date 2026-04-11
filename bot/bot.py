import os
from datetime import date, timedelta
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = "https://fimwqcqaynjrpepkfjwh.supabase.co"
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BOT_TOKEN    = os.environ["TELEGRAM_BOT_TOKEN"]

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_week_start() -> str:
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    return monday.isoformat()


async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "*Innovagency Bot*\n\n"
        "/eod — This week's performance snapshot\n"
        "/client <slug> — Client detail (e.g. /client zitcomfort)\n"
        "/tasks — Open tasks\n",
        parse_mode="Markdown"
    )


async def eod(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    week_start = get_week_start()

    res = (
        sb.table("metric_snapshots")
        .select("*, clients(name)")
        .eq("week_start", week_start)
        .execute()
    )

    if not res.data:
        await update.message.reply_text(f"No snapshot data found for w/o {week_start} yet.")
        return

    lines = [f"*EOD Report — w/o {week_start}*\n"]
    for r in res.data:
        name = r["clients"]["name"]
        lines.append(
            f"*{name}*\n"
            f"  Spend: €{r['total_spend']:.2f}  |  CPA: €{r['avg_cpa']:.2f}\n"
            f"  Conversions: {r['total_conversions']}  |  CVR: {r['conversion_rate']:.1f}%\n"
            f"  Meta €{r['meta_spend']:.2f}  |  Google €{r['gads_spend']:.2f}\n"
        )

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def client_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not ctx.args:
        await update.message.reply_text("Usage: /client <slug>\nExample: /client zitcomfort")
        return

    slug = ctx.args[0].lower()

    client_res = (
        sb.table("clients")
        .select("id, name")
        .eq("slug", slug)
        .maybe_single()
        .execute()
    )

    if not client_res.data:
        await update.message.reply_text(f"Client '{slug}' not found.")
        return

    client = client_res.data

    res = (
        sb.table("metric_snapshots")
        .select("*")
        .eq("client_id", client["id"])
        .order("week_start", desc=True)
        .limit(4)
        .execute()
    )

    if not res.data:
        await update.message.reply_text(f"No snapshot data found for {client['name']}.")
        return

    lines = [f"*{client['name']} — Last {len(res.data)} weeks*\n"]
    for r in res.data:
        lines.append(
            f"*w/o {r['week_start']}*\n"
            f"  Spend: €{r['total_spend']:.2f}  |  CPA: €{r['avg_cpa']:.2f}\n"
            f"  Conversions: {r['total_conversions']}  |  CVR: {r['conversion_rate']:.1f}%\n"
            f"  Meta CTR: {r['meta_ctr']:.2f}%  |  Google CTR: {r['gads_ctr']:.2f}%\n"
            f"  GA Sessions: {r['ga_sessions']}  |  Organic users: {r['ga_organic_users']}\n"
        )

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def tasks_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    res = (
        sb.table("tasks")
        .select("*, clients(name)")
        .in_("status", ["todo", "in_progress", "review"])
        .order("priority", desc=True)
        .execute()
    )

    if not res.data:
        await update.message.reply_text("No open tasks.")
        return

    lines = [f"*Open Tasks ({len(res.data)})*\n"]
    for r in res.data:
        status_icon   = {"todo": "⬜", "in_progress": "🔄", "review": "👀"}.get(r["status"], "")
        priority_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(r["priority"], "")
        client_name   = r["clients"]["name"] if r.get("clients") else "—"
        lines.append(f"{status_icon}{priority_icon} *{r['title']}* — {client_name}")

    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


app = ApplicationBuilder().token(BOT_TOKEN).build()
app.add_handler(CommandHandler("start",  start))
app.add_handler(CommandHandler("eod",    eod))
app.add_handler(CommandHandler("client", client_cmd))
app.add_handler(CommandHandler("tasks",  tasks_cmd))

print("Bot is running...")
app.run_polling()
