from twilio.rest import Client
from app.config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_twilio_client() -> Client:
    """Get or create Twilio client."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    return _client


async def send_freeform_message(to: str, body: str) -> dict:
    """Send a freeform WhatsApp message (within 24h window)."""
    settings = get_settings()
    client = get_twilio_client()

    try:
        message = client.messages.create(
            from_=f"whatsapp:{settings.twilio_whatsapp_number}",
            to=f"whatsapp:{to}" if not to.startswith("whatsapp:") else to,
            body=body,
        )
        logger.info(f"Sent freeform message to {to}: {message.sid}")
        return {"success": True, "message_sid": message.sid}
    except Exception as e:
        logger.error(f"Failed to send freeform message to {to}: {e}")
        return {"success": False, "error": str(e)}


async def send_template_message(to: str, content_sid: str, variables: dict = None) -> dict:
    """Send a WhatsApp template message using Twilio Content API."""
    settings = get_settings()
    client = get_twilio_client()

    try:
        kwargs = {
            "from_": f"whatsapp:{settings.twilio_whatsapp_number}",
            "to": f"whatsapp:{to}" if not to.startswith("whatsapp:") else to,
            "content_sid": content_sid,
        }

        if variables:
            kwargs["content_variables"] = str(variables)

        message = client.messages.create(**kwargs)
        logger.info(f"Sent template {content_sid} to {to}: {message.sid}")
        return {"success": True, "message_sid": message.sid}
    except Exception as e:
        logger.error(f"Failed to send template to {to}: {e}")
        return {"success": False, "error": str(e)}


async def create_content_template(
    name: str,
    body: str,
    variables: dict = None,
    category: str = "utility",
    language: str = "fr",
) -> dict:
    """Create a new WhatsApp template via Twilio Content API."""
    settings = get_settings()
    client = get_twilio_client()

    try:
        # Build the content template body
        types = {
            "twilio/text": {
                "body": body,
            }
        }

        if variables:
            types["twilio/text"]["variables"] = variables

        content = client.content.v1.contents.create(
            friendly_name=name,
            language=language,
            types=types,
        )

        logger.info(f"Created content template: {content.sid}")
        return {"success": True, "content_sid": content.sid, "status": "draft"}
    except Exception as e:
        logger.error(f"Failed to create content template: {e}")
        return {"success": False, "error": str(e)}


async def submit_template_for_approval(content_sid: str, name: str, category: str = "UTILITY") -> dict:
    """Submit a content template for WhatsApp/Meta approval."""
    settings = get_settings()
    client = get_twilio_client()

    try:
        approval = client.content.v1.contents(content_sid).approval_requests.create(
            name=name,
            category=category.lower(),
        )

        logger.info(f"Submitted template {content_sid} for approval")
        return {"success": True, "status": "pending"}
    except Exception as e:
        logger.error(f"Failed to submit template for approval: {e}")
        return {"success": False, "error": str(e)}


async def check_template_approval_status(content_sid: str) -> dict:
    """Check the approval status of a content template."""
    settings = get_settings()
    client = get_twilio_client()

    try:
        approval = client.content.v1.contents(content_sid).approval_fetch.fetch()
        return {
            "success": True,
            "content_sid": content_sid,
            "status": approval.status,
        }
    except Exception as e:
        logger.error(f"Failed to check template status: {e}")
        return {"success": False, "error": str(e)}
