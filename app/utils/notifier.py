import os
from telegram import Bot
from telegram.error import TelegramError
import asyncio

# Initialize bot
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

async def send_telegram_notification(message: str):
    """Send notification via Telegram bot."""
    try:
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            print("Telegram credentials not configured")
            return
            
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        await bot.send_message(
            chat_id=TELEGRAM_CHAT_ID,
            text=message
        )
        
    except TelegramError as e:
        print(f"Telegram notification failed: {str(e)}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")