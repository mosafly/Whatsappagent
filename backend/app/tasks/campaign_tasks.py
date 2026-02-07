from app.tasks.celery_app import celery_app
from app.services.twilio_service import send_template_message
from app.services.supabase_service import update_campaign
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


@celery_app.task(bind=True, name="app.tasks.campaign_tasks.send_campaign_bulk", max_retries=0)
def send_campaign_bulk(self, campaign_id: str, content_sid: str, phones: list[str], variables: dict = None):
    """Send a template message to all phones in the audience.

    Rate limited to 1 message/second to respect Twilio limits.
    Updates campaign stats (sent_count, delivered_count) as it progresses.
    """
    total = len(phones)
    sent = 0
    delivered = 0
    failed = 0

    logger.info(f"Campaign {campaign_id}: starting bulk send to {total} recipients")

    for i, phone in enumerate(phones):
        try:
            result = _run_async(send_template_message(
                to=phone,
                content_sid=content_sid,
                variables=variables,
            ))

            if result["success"]:
                sent += 1
                delivered += 1
            else:
                sent += 1
                failed += 1
                logger.warning(f"Campaign {campaign_id}: failed to send to {phone}: {result.get('error')}")

        except Exception as e:
            sent += 1
            failed += 1
            logger.error(f"Campaign {campaign_id}: error sending to {phone}: {e}")

        # Update progress every 10 messages
        if (i + 1) % 10 == 0 or (i + 1) == total:
            _run_async(update_campaign(campaign_id, {
                "sent_count": sent,
                "delivered_count": delivered,
            }))
            self.update_state(
                state="PROGRESS",
                meta={"sent": sent, "delivered": delivered, "failed": failed, "total": total},
            )

        # Rate limiting: 1 message per second
        time.sleep(1)

    # Final update
    final_status = "completed" if failed == 0 else "completed_with_errors"
    _run_async(update_campaign(campaign_id, {
        "status": final_status,
        "sent_count": sent,
        "delivered_count": delivered,
    }))

    logger.info(f"Campaign {campaign_id}: completed. Sent={sent}, Delivered={delivered}, Failed={failed}")

    return {
        "campaign_id": campaign_id,
        "status": final_status,
        "sent": sent,
        "delivered": delivered,
        "failed": failed,
        "total": total,
    }
