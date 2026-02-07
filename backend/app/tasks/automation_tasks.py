from app.tasks.celery_app import celery_app
from app.services.supabase_service import (
    get_active_automations,
    get_audience_phones,
    get_template_by_name,
    get_all_templates,
    upsert_template,
    increment_automation_executions,
)
from app.services.twilio_service import send_template_message, check_template_approval_status
import asyncio
import logging
import time

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Helper to run async functions from sync Celery tasks."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


# Mapping automation trigger types to audience segments
TRIGGER_TO_SEGMENT = {
    "new_customer": "new_7d",
    "inactive_30d": "inactive_30d",
    "cart_abandoned": "active_30d",
    "order_created": "all",
    "post_purchase": "active_30d",
}


@celery_app.task(name="app.tasks.automation_tasks.check_automations")
def check_automations():
    """Periodic task: check active automations and execute them.

    Runs every 5 minutes via Celery Beat.
    For each active automation:
    1. Resolve the audience based on trigger type
    2. Send the template to matching recipients
    3. Increment execution count
    """
    automations = _run_async(get_active_automations())

    if not automations:
        return {"checked": 0, "executed": 0}

    executed = 0

    for automation in automations:
        try:
            template_name = automation.get("template_name")
            trigger_type = automation.get("trigger_type")

            if not template_name or not trigger_type:
                continue

            # Get template
            template = _run_async(get_template_by_name(template_name))
            if not template or template["status"] != "approved":
                logger.warning(f"Automation {automation['id']}: template '{template_name}' not approved, skipping")
                continue

            content_sid = template.get("twilio_content_sid")
            if not content_sid:
                continue

            # Resolve audience
            segment = TRIGGER_TO_SEGMENT.get(trigger_type, "all")
            phones = _run_async(get_audience_phones(segment))

            if not phones:
                continue

            # Send to each recipient (with rate limiting)
            for phone in phones:
                try:
                    _run_async(send_template_message(to=phone, content_sid=content_sid))
                    time.sleep(1)  # Rate limit
                except Exception as e:
                    logger.error(f"Automation {automation['id']}: failed to send to {phone}: {e}")

            # Update execution count
            _run_async(increment_automation_executions(automation["id"]))
            executed += 1

            logger.info(f"Automation {automation['id']} ({automation['name']}): sent to {len(phones)} recipients")

        except Exception as e:
            logger.error(f"Automation {automation['id']} failed: {e}", exc_info=True)

    return {"checked": len(automations), "executed": executed}


@celery_app.task(name="app.tasks.automation_tasks.check_template_approvals")
def check_template_approvals():
    """Periodic task: check pending template approvals on Twilio.

    Runs every hour via Celery Beat.
    Updates local status when Meta approves/rejects a template.
    """
    templates = _run_async(get_all_templates())
    pending = [t for t in templates if t["status"] == "pending" and t.get("twilio_content_sid")]

    if not pending:
        return {"checked": 0, "updated": 0}

    updated = 0

    for template in pending:
        try:
            result = _run_async(check_template_approval_status(template["twilio_content_sid"]))

            if result["success"] and result.get("status") != "pending":
                _run_async(upsert_template({
                    "name": template["name"],
                    "status": result["status"],
                }))
                updated += 1
                logger.info(f"Template '{template['name']}' status updated to: {result['status']}")

        except Exception as e:
            logger.error(f"Failed to check template '{template['name']}': {e}")

    return {"checked": len(pending), "updated": updated}
