import asyncio
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from ..core.config import settings

logger = logging.getLogger(__name__)


def _send_sync(to_email: str, subject: str, html_content: str) -> None:
    if not settings.mail_server or not settings.mail_username:
        logger.warning("SMTP not configured — skipping email to %s", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.mail_from or settings.mail_username
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(settings.mail_server, settings.mail_port) as server:
        if settings.mail_starttls:
            server.starttls()
        server.login(settings.mail_username, settings.mail_password)
        server.send_message(msg)


async def send_email(to_email: str, subject: str, html_content: str) -> None:
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, _send_sync, to_email, subject, html_content)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)


async def send_verification_email(to_email: str, token: str) -> None:
    url = f"{settings.frontend_url}/verify-email?token={token}"
    html = f"""
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2>Verify your email — The Hive Platform</h2>
      <p>Thanks for joining! Click the button below to verify your email address.</p>
      <p>
        <a href="{url}"
           style="display:inline-block;padding:12px 24px;background:#65a30d;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;">
        This link expires in 24 hours. If you didn't create an account you can ignore this email.
      </p>
    </body>
    </html>
    """
    await send_email(to_email, "Verify your email — The Hive Platform", html)
