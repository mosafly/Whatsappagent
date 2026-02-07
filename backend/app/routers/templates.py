from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    CreateTemplateRequest,
    TemplateResponse,
    SendTemplateRequest,
    SendTemplateResponse,
)
from app.services.supabase_service import (
    get_all_templates,
    get_template_by_name,
    upsert_template,
)
from app.services.twilio_service import (
    send_template_message,
    create_content_template,
    submit_template_for_approval,
    check_template_approval_status,
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Templates"])


@router.get("/templates", response_model=list[TemplateResponse])
async def list_templates():
    """List all WhatsApp templates from Supabase."""
    templates = await get_all_templates()
    return [
        TemplateResponse(
            id=t["id"],
            name=t["name"],
            display_name=t["display_name"],
            category=t["category"],
            status=t["status"],
            language=t["language"],
            body=t["body"],
            variables=t.get("variables", []),
            twilio_content_sid=t.get("twilio_content_sid"),
        )
        for t in templates
    ]


@router.post("/templates", response_model=TemplateResponse)
async def create_template(request: CreateTemplateRequest):
    """Create a new WhatsApp template and submit to Twilio for approval.

    Flow:
    1. Create content template on Twilio Content API
    2. Submit for Meta/WhatsApp approval
    3. Save to Supabase whatsapp_templates with status 'pending'
    """
    # 1. Create on Twilio
    twilio_result = await create_content_template(
        name=request.name,
        body=request.body,
        category=request.category.value.lower(),
        language=request.language,
    )

    if not twilio_result["success"]:
        raise HTTPException(status_code=500, detail=f"Twilio error: {twilio_result['error']}")

    content_sid = twilio_result["content_sid"]

    # 2. Submit for approval
    approval_result = await submit_template_for_approval(
        content_sid=content_sid,
        name=request.name,
        category=request.category.value,
    )

    status = "pending" if approval_result["success"] else "draft"

    # 3. Save to Supabase
    template_data = {
        "name": request.name,
        "display_name": request.display_name,
        "category": request.category.value,
        "status": status,
        "language": request.language,
        "body": request.body,
        "variables": request.variables,
        "twilio_content_sid": content_sid,
    }
    saved = await upsert_template(template_data)

    return TemplateResponse(
        id=saved.get("id", ""),
        name=request.name,
        display_name=request.display_name,
        category=request.category.value,
        status=status,
        language=request.language,
        body=request.body,
        variables=request.variables,
        twilio_content_sid=content_sid,
    )


@router.post("/templates/send", response_model=SendTemplateResponse)
async def send_template(request: SendTemplateRequest):
    """Send a WhatsApp template message to a recipient."""
    # Fetch template from DB
    template = await get_template_by_name(request.template_name)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{request.template_name}' not found")

    if template["status"] != "approved":
        raise HTTPException(status_code=400, detail=f"Template '{request.template_name}' is not approved (status: {template['status']})")

    content_sid = template.get("twilio_content_sid")
    if not content_sid:
        raise HTTPException(status_code=400, detail=f"Template '{request.template_name}' has no Twilio Content SID")

    # Send via Twilio
    result = await send_template_message(
        to=request.to,
        content_sid=content_sid,
        variables=request.variables,
    )

    return SendTemplateResponse(
        success=result["success"],
        message_sid=result.get("message_sid"),
        error=result.get("error"),
    )


@router.get("/templates/{template_name}/status")
async def get_template_status(template_name: str):
    """Check the approval status of a template on Twilio/Meta."""
    template = await get_template_by_name(template_name)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{template_name}' not found")

    content_sid = template.get("twilio_content_sid")
    if not content_sid:
        return {"name": template_name, "status": template["status"], "twilio_status": "no_sid"}

    result = await check_template_approval_status(content_sid)

    # Update local status if changed
    if result["success"] and result.get("status") != template["status"]:
        await upsert_template({
            "name": template_name,
            "status": result["status"],
        })

    return {
        "name": template_name,
        "local_status": template["status"],
        "twilio_status": result.get("status", "unknown"),
        "content_sid": content_sid,
    }
