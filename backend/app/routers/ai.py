from fastapi import APIRouter, HTTPException
from app.models.schemas import AIRequestBody, AIResponseBody
from app.services.rag import generate_ai_response
from app.services.twilio_service import send_freeform_message
from app.services.supabase_service import (
    get_conversation,
    insert_message,
    insert_ai_log,
)
import time
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["AI"])


@router.post("/ai-response", response_model=AIResponseBody)
async def ai_response(request: AIRequestBody):
    """Process an incoming WhatsApp message and generate an AI response.

    This endpoint replaces the n8n RAG workflow:
    1. Generates AI response via RAG (LangChain + Supabase pgvector)
    2. Saves the AI response to Supabase messages
    3. Sends the response via Twilio WhatsApp
    4. Logs the interaction to ai_logs
    """
    start_time = time.time()

    try:
        # 1. Verify conversation exists
        conversation = await get_conversation(request.conversationId)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        shop_id = conversation.get("shop_id", "")

        # 2. Generate AI response via RAG
        ai_text = await generate_ai_response(
            message=request.Body,
            conversation_id=request.conversationId,
        )

        # 3. Save AI response to messages
        await insert_message(
            conversation_id=request.conversationId,
            shop_id=shop_id,
            role="agent",
            content=ai_text,
            metadata={"source": "rag-fastapi", "customer_phone": request.From},
        )

        # 4. Send via Twilio WhatsApp
        twilio_result = await send_freeform_message(to=request.From, body=ai_text)

        if not twilio_result["success"]:
            logger.error(f"Twilio send failed: {twilio_result.get('error')}")

        # 5. Log the interaction
        latency_ms = int((time.time() - start_time) * 1000)
        await insert_ai_log(
            shop_id=shop_id,
            conversation_id=request.conversationId,
            input_text=request.Body,
            output_text=ai_text,
            metrics={
                "latency_ms": latency_ms,
                "provider": "openrouter-gpt-4o-mini",
                "source": "fastapi-rag",
                "twilio_sid": twilio_result.get("message_sid"),
                "twilio_success": twilio_result["success"],
            },
        )

        return AIResponseBody(
            success=True,
            response=ai_text,
            latency_ms=latency_ms,
        )

    except HTTPException:
        raise
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        logger.error(f"AI response failed: {e}", exc_info=True)
        return AIResponseBody(
            success=False,
            response="",
            latency_ms=latency_ms,
            error=str(e),
        )
