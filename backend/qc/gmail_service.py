"""
Gmail API Email Sender using OAuth2 with Async Outbox Queue

Instead of sending synchronously during a user's API request (which blocks and
loses emails on token expiry), emails are written to EmailOutbox (PENDING)
and dispatched in a background thread via transaction.on_commit() — so the
thread only fires AFTER the DB row is safely committed.
"""

import os
import base64
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from django.db import transaction
from django.utils import timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from django.conf import settings

# Gmail API scope for sending emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']


def get_gmail_credentials():
    """
    Get or refresh Gmail API credentials.

    Tries environment variable GMAIL_TOKEN_JSON first (Cloud Run),
    then falls back to token file path (local dev).
    Raises Exception if credentials are missing or invalid.
    """
    creds = None

    # Cloud Run: load from environment variable
    token_json = os.getenv('GMAIL_TOKEN_JSON')
    if token_json:
        import json
        token_data = json.loads(token_json)
        creds = Credentials.from_authorized_user_info(token_data, SCOPES)

    # Local dev: load from file
    token_path = getattr(settings, 'GMAIL_TOKEN_PATH', 'gmail-token.json')
    if not creds and os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # Refresh if expired
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        if os.path.exists(token_path):
            with open(token_path, 'w') as token:
                token.write(creds.to_json())

    if not creds or not creds.valid:
        raise Exception(
            "Gmail credentials not found or invalid. "
            "Run 'python scripts/setup_gmail_oauth.py' to set up OAuth."
        )

    return creds


def send_gmail_message(to_emails, subject, body, attachments=None, cc_emails=None, from_email=None):
    """
    Send an email immediately via the Gmail API (synchronous, low-level).

    Prefer queue_email() for all production use so the API request is not blocked.
    This function is retained for direct use when synchronous sending is explicitly needed.
    """
    creds = get_gmail_credentials()
    service = build('gmail', 'v1', credentials=creds)

    message = MIMEMultipart()
    message['to'] = ', '.join(to_emails)
    message['subject'] = subject
    sender = from_email or getattr(settings, 'GMAIL_SENDER_EMAIL', 'me')
    message['from'] = sender

    if cc_emails:
        message['cc'] = ', '.join(cc_emails)

    message.attach(MIMEText(body, 'plain'))

    if attachments:
        for filename, content, mime_type in attachments:
            maintype, subtype = mime_type.split('/', 1)
            part = MIMEBase(maintype, subtype)
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', 'attachment', filename=filename)
            message.attach(part)

    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
    result = service.users().messages().send(
        userId='me',
        body={'raw': raw_message}
    ).execute()
    return result


def _send_outbox_background(outbox_id, attachment_bytes=None):
    """
    Background worker: loads the EmailOutbox row, sends via Gmail API, and
    marks the row SENT or FAILED with an error_message for admin visibility.
    """
    from qc.models.core import EmailOutbox  # local import avoids circular deps

    try:
        outbox_email = EmailOutbox.objects.get(id=outbox_id)
    except EmailOutbox.DoesNotExist:
        return

    try:
        to_emails = [e.strip() for e in outbox_email.recipients.split(',') if e.strip()]
        cc_emails = [e.strip() for e in outbox_email.cc.split(',') if e.strip()]

        attachments = None
        if attachment_bytes and outbox_email.attachment_filename:
            attachments = [(outbox_email.attachment_filename, attachment_bytes, 'application/pdf')]

        send_gmail_message(
            to_emails=to_emails,
            subject=outbox_email.subject,
            body=outbox_email.body,
            attachments=attachments,
            cc_emails=cc_emails or None,
        )
        outbox_email.status = EmailOutbox.STATUS_SENT
        outbox_email.sent_at = timezone.now()
        outbox_email.error_message = ''
        outbox_email.save(update_fields=['status', 'sent_at', 'error_message'])

    except Exception as exc:
        outbox_email.status = EmailOutbox.STATUS_FAILED
        outbox_email.error_message = str(exc)
        outbox_email.save(update_fields=['status', 'error_message'])


def queue_email(to_emails, subject, body, attachment_bytes=None, attachment_filename='', cc_emails=None):
    """
    Queue an email for async delivery via a background thread.

    Immediately persists the email to EmailOutbox (PENDING) then fires a
    daemon thread via transaction.on_commit() — guaranteeing the outbox row
    is committed before the thread starts, so no emails are lost on rollback.

    Args:
        to_emails: List of To: email addresses
        subject: Email subject line
        body: Plain-text email body
        attachment_bytes: Optional raw bytes of a PDF attachment
        attachment_filename: Filename for the attachment (e.g. 'Report.pdf')
        cc_emails: Optional list of CC: email addresses

    Returns:
        EmailOutbox: The newly created outbox record (status=PENDING)
    """
    from qc.models.core import EmailOutbox  # local import avoids circular deps

    outbox_email = EmailOutbox.objects.create(
        recipients=', '.join(to_emails),
        cc=', '.join(cc_emails) if cc_emails else '',
        subject=subject,
        body=body,
        attachment_filename=attachment_filename,
    )

    def _fire():
        t = threading.Thread(
            target=_send_outbox_background,
            args=(outbox_email.id, attachment_bytes),
            daemon=True,
        )
        t.start()

    transaction.on_commit(_fire)
    return outbox_email

