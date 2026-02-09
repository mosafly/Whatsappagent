from supabase import create_client, Client
from app.config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get or create Supabase admin client (service role)."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


async def get_conversation(conversation_id: str) -> Optional[dict]:
    """Fetch a conversation by ID."""
    client = get_supabase()
    try:
        result = client.table("conversations").select("*").eq("id", conversation_id).maybe_single().execute()
        return result.data
    except Exception as e:
        logger.warning(f"get_conversation({conversation_id}): {e}")
        # Fallback: try with .execute() and pick first result
        try:
            result = client.table("conversations").select("*").eq("id", conversation_id).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]
        except Exception as e2:
            logger.error(f"get_conversation fallback failed: {e2}")
        return None


async def get_conversation_messages(conversation_id: str, limit: int = 10) -> list[dict]:
    """Fetch recent messages for a conversation, ordered oldest first."""
    client = get_supabase()
    result = (
        client.table("messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    messages = result.data or []
    messages.reverse()
    return messages


async def insert_message(conversation_id: str, shop_id: str, role: str, content: str, metadata: dict = None) -> dict:
    """Insert a message into the messages table."""
    client = get_supabase()
    data = {
        "conversation_id": conversation_id,
        "shop_id": shop_id,
        "role": role,
        "content": content,
        "type": "text",
        "metadata": metadata or {},
    }
    result = client.table("messages").insert(data).execute()
    return result.data[0] if result.data else {}


async def insert_ai_log(shop_id: str, conversation_id: str, input_text: str, output_text: str, metrics: dict = None):
    """Log an AI interaction for audit."""
    client = get_supabase()
    client.table("ai_logs").insert({
        "shop_id": shop_id,
        "conversation_id": conversation_id,
        "input": input_text,
        "output": output_text,
        "metrics": metrics or {},
    }).execute()


async def get_template_by_name(template_name: str) -> Optional[dict]:
    """Fetch a WhatsApp template by name."""
    client = get_supabase()
    result = (
        client.table("whatsapp_templates")
        .select("*")
        .eq("name", template_name)
        .maybe_single()
        .execute()
    )
    return result.data


async def get_all_templates() -> list[dict]:
    """Fetch all WhatsApp templates."""
    client = get_supabase()
    result = client.table("whatsapp_templates").select("*").order("created_at").execute()
    return result.data or []


async def upsert_template(template_data: dict) -> dict:
    """Insert or update a WhatsApp template."""
    client = get_supabase()
    result = client.table("whatsapp_templates").upsert(template_data, on_conflict="name").execute()
    return result.data[0] if result.data else {}


async def get_campaign(campaign_id: str) -> Optional[dict]:
    """Fetch a campaign by ID."""
    client = get_supabase()
    result = client.table("campaigns").select("*").eq("id", campaign_id).maybe_single().execute()
    return result.data


async def update_campaign(campaign_id: str, data: dict):
    """Update campaign fields."""
    client = get_supabase()
    client.table("campaigns").update(data).eq("id", campaign_id).execute()


async def get_audience_phones(segment: str = "all") -> list[str]:
    """Get phone numbers for a campaign audience segment."""
    client = get_supabase()

    if segment == "active_30d":
        from datetime import datetime, timedelta
        cutoff = (datetime.utcnow() - timedelta(days=30)).isoformat()
        result = (
            client.table("conversations")
            .select("customer_phone")
            .eq("status", "active")
            .gte("last_message_at", cutoff)
            .execute()
        )
    elif segment == "inactive_30d":
        from datetime import datetime, timedelta
        cutoff = (datetime.utcnow() - timedelta(days=30)).isoformat()
        result = (
            client.table("conversations")
            .select("customer_phone")
            .lt("last_message_at", cutoff)
            .execute()
        )
    elif segment == "new_7d":
        from datetime import datetime, timedelta
        cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()
        result = (
            client.table("conversations")
            .select("customer_phone")
            .gte("created_at", cutoff)
            .execute()
        )
    else:
        result = client.table("conversations").select("customer_phone").execute()

    phones = list({row["customer_phone"] for row in (result.data or [])})
    return phones


async def get_active_automations() -> list[dict]:
    """Fetch all active automations."""
    client = get_supabase()
    result = (
        client.table("automations")
        .select("*")
        .eq("is_active", True)
        .execute()
    )
    return result.data or []


async def increment_automation_executions(automation_id: str):
    """Increment the execution count for an automation."""
    client = get_supabase()
    automation = client.table("automations").select("executions_count").eq("id", automation_id).single().execute()
    current = automation.data.get("executions_count", 0) if automation.data else 0
    client.table("automations").update({"executions_count": current + 1}).eq("id", automation_id).execute()
