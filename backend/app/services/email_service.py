import logging
import smtplib
import uuid
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


def generate_verification_token() -> str:
    return uuid.uuid4().hex


def create_verification_token(user: User, db: Session) -> str:
    token = generate_verification_token()
    user.verification_token = token
    user.verification_token_expires_at = datetime.utcnow() + timedelta(
        hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS
    )
    db.commit()
    return token


def send_verification_email(user: User, token: str) -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Skipping verification email.")
        return False

    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html_content = _build_verification_html(user.username, verification_url)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "[DearMe] 이메일 인증을 완료해주세요"
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = user.email

    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, user.email, msg.as_string())
        logger.info(f"Verification email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {e}")
        return False


def verify_token(token: str, db: Session) -> User | None:
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        return None

    if user.verification_token_expires_at and user.verification_token_expires_at < datetime.utcnow():
        return None

    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    db.commit()
    return user


def _build_verification_html(username: str, verification_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">DearMe</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">일기 기반 AI 페르소나 서비스</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">안녕하세요, {username}님!</h2>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                DearMe에 가입해주셔서 감사합니다.<br>
                아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="{verification_url}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;">
                      이메일 인증하기
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                버튼이 작동하지 않으면 아래 링크를 브라우저에 직접 붙여넣어 주세요:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="{verification_url}" style="color:#6366f1;font-size:13px;">{verification_url}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                이 링크는 24시간 동안 유효합니다.<br>
                본인이 가입하지 않았다면 이 이메일을 무시해주세요.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">DearMe Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
