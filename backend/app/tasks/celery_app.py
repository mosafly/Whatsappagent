from celery import Celery
from celery.schedules import crontab
import os

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "bobotcho",
    broker=redis_url,
    backend=redis_url,
    include=[
        "app.tasks.campaign_tasks",
        "app.tasks.automation_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Abidjan",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Rate limiting for Twilio (1 message per second)
    task_default_rate_limit="1/s",
)

# Celery Beat schedule for automations
celery_app.conf.beat_schedule = {
    "check-automations-every-5-minutes": {
        "task": "app.tasks.automation_tasks.check_automations",
        "schedule": crontab(minute="*/5"),
    },
    "check-template-approvals-hourly": {
        "task": "app.tasks.automation_tasks.check_template_approvals",
        "schedule": crontab(minute=0),
    },
}
