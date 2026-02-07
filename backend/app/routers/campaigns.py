from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    CampaignSendRequest,
    CampaignSendResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.supabase_service import (
    get_campaign,
    update_campaign,
    get_audience_phones,
    get_template_by_name,
)
from app.services.twilio_service import send_freeform_message
from app.tasks.campaign_tasks import send_campaign_bulk
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Campaigns"])


@router.post("/campaigns/send", response_model=CampaignSendResponse)
async def launch_campaign(request: CampaignSendRequest):
    """Launch a campaign: resolve audience, then dispatch bulk send via Celery.

    1. Validate campaign and template exist
    2. Resolve audience phone numbers
    3. Dispatch Celery task for async bulk sending
    4. Update campaign status to 'sending'
    """
    # 1. Validate campaign
    campaign = await get_campaign(request.campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # 2. Validate template
    template = await get_template_by_name(request.template_name)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{request.template_name}' not found")

    if template["status"] != "approved":
        raise HTTPException(status_code=400, detail=f"Template not approved: {template['status']}")

    content_sid = template.get("twilio_content_sid")
    if not content_sid:
        raise HTTPException(status_code=400, detail="Template has no Twilio Content SID")

    # 3. Resolve audience
    phones = await get_audience_phones(request.audience)
    if not phones:
        raise HTTPException(status_code=400, detail="No recipients found for this audience segment")

    # 4. Dispatch Celery task
    task = send_campaign_bulk.delay(
        campaign_id=request.campaign_id,
        content_sid=content_sid,
        phones=phones,
        variables=request.variables,
    )

    # 5. Update campaign status
    await update_campaign(request.campaign_id, {
        "status": "sending",
        "sent_count": 0,
    })

    logger.info(f"Campaign {request.campaign_id} dispatched: {len(phones)} recipients, task={task.id}")

    return CampaignSendResponse(
        success=True,
        task_id=task.id,
        estimated_recipients=len(phones),
    )


@router.post("/messages/send", response_model=SendMessageResponse)
async def send_message(request: SendMessageRequest):
    """Send a freeform WhatsApp message (for conversations page)."""
    result = await send_freeform_message(to=request.to, body=request.body)
    return SendMessageResponse(
        success=result["success"],
        message_sid=result.get("message_sid"),
        error=result.get("error"),
    )
