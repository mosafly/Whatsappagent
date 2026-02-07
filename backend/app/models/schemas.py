from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── AI Response ──────────────────────────────────────────────────────────────

class AIRequestBody(BaseModel):
    Body: str = Field(..., description="Message content from the customer")
    From: str = Field(..., description="Customer phone number (e.g. +225...)")
    conversationId: str = Field(..., description="Supabase conversation UUID")
    messageId: str = Field(..., description="Supabase message UUID")


class AIResponseBody(BaseModel):
    success: bool
    response: str = Field("", description="AI-generated response text")
    latency_ms: int = 0
    error: Optional[str] = None


# ── Templates ────────────────────────────────────────────────────────────────

class TemplateCategory(str, Enum):
    MARKETING = "MARKETING"
    UTILITY = "UTILITY"
    AUTHENTICATION = "AUTHENTICATION"


class TemplateStatus(str, Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"


class CreateTemplateRequest(BaseModel):
    name: str = Field(..., description="Template name (snake_case)")
    display_name: str = Field(..., description="Human-readable display name")
    category: TemplateCategory = TemplateCategory.UTILITY
    language: str = "fr"
    body: str = Field(..., description="Template body with {{1}}, {{2}} variables")
    variables: list[str] = Field(default_factory=list, description="Variable descriptions")


class TemplateResponse(BaseModel):
    id: str
    name: str
    display_name: str
    category: str
    status: str
    language: str
    body: str
    variables: list[str]
    twilio_content_sid: Optional[str] = None


class SendTemplateRequest(BaseModel):
    to: str = Field(..., description="Recipient phone number (e.g. +2250104278080)")
    template_name: str = Field(..., description="Template name from whatsapp_templates table")
    variables: dict[str, str] = Field(default_factory=dict, description="Variable values keyed by position")


class SendTemplateResponse(BaseModel):
    success: bool
    message_sid: Optional[str] = None
    error: Optional[str] = None


# ── Campaigns ────────────────────────────────────────────────────────────────

class CampaignSendRequest(BaseModel):
    campaign_id: str = Field(..., description="Campaign UUID from Supabase")
    template_name: str = Field(..., description="Template name to use")
    audience: str = Field("all", description="Audience segment: all, active_30d, inactive_30d, new_7d")
    variables: dict[str, str] = Field(default_factory=dict, description="Default variable values")


class CampaignSendResponse(BaseModel):
    success: bool
    task_id: str = Field("", description="Celery task ID for tracking")
    estimated_recipients: int = 0
    error: Optional[str] = None


# ── Send Message (freeform) ──────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    to: str = Field(..., description="Recipient phone number")
    body: str = Field(..., description="Message text")


class SendMessageResponse(BaseModel):
    success: bool
    message_sid: Optional[str] = None
    error: Optional[str] = None
