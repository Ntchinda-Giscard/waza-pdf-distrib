import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

def send_emails_with_logging(
    email_list,
    subject,
    body,
    smtp_server,
    smtp_port,
    sender_email,
    sender_password,
    log_dir="email_logs"
):
    """
    Send emails to a list of recipients and log results.
    
    Parameters:
    - email_list: List of recipient email addresses
    - subject: Email subject
    - body: Email body content
    - smtp_server: SMTP server address (e.g., 'smtp.gmail.com')
    - smtp_port: SMTP port (e.g., 587 for TLS)
    - sender_email: Your email address
    - sender_password: Your email password or app password
    - log_dir: Directory to store log files (default: 'email_logs')
    
    Returns:
    - Dictionary with statistics about sent and failed emails
    """
    
    # Create log directory if it doesn't exist
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Generate unique log filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"email_log_{timestamp}.txt")
    
    sent_count = 0
    failed_count = 0
    sent_emails = []
    failed_emails = []
    
    # Connect to SMTP server
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        
        # Send email to each recipient
        for recipient in email_list:
            try:
                # Create message
                msg = MIMEMultipart()
                msg['From'] = sender_email
                msg['To'] = recipient
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'plain'))
                
                # Send email
                server.send_message(msg)
                sent_count += 1
                sent_emails.append(recipient)
                print(f" Email sent successfully to: {recipient}")
                
            except Exception as e:
                failed_count += 1
                failed_emails.append(recipient)
                print(f" Failed to send email to {recipient}: {str(e)}")
        
        server.quit()
        
    except Exception as e:
        print(f"Error connecting to SMTP server: {str(e)}")
        failed_count = len(email_list)
        failed_emails = email_list.copy()
    
    # Always create log file for each run
    write_log(log_file, sent_count, failed_count, sent_emails, failed_emails)
    
    # Return statistics
    return {
        'sent_count': sent_count,
        'failed_count': failed_count,
        'sent_emails': sent_emails,
        'failed_emails': failed_emails
    }


def write_log(log_file, sent_count, failed_count, sent_emails, failed_emails):
    """Write email sending results to a log file."""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(log_file, 'w') as f:
        f.write("=" * 60 + "\n")
        f.write(f"Email Sending Log - {timestamp}\n")
        f.write("=" * 60 + "\n\n")
        
        f.write(f"Total Emails Sent Successfully: {sent_count}\n")
        f.write(f"Total Emails Failed: {failed_count}\n\n")
        
        if sent_emails:
            f.write("Successfully Sent To:\n")
            for email in sent_emails:
                f.write(f"  {email}\n")
            f.write("\n")
        
        if failed_emails:
            f.write("Failed To Send To:\n")
            for email in failed_emails:
                f.write(f"  {email}\n")
            f.write("\n")
        
        f.write("\n")
    
    print(f"\nLog file created/updated: {log_file}")


# Example usage
if __name__ == "__main__":
    # Configuration
    EMAIL_LIST = [
        "recipient1@example.com",
        "recipient2@example.com",
        "recipient3@example.com"
    ]
    
    SUBJECT = "Test Email"
    BODY = "This is a test email sent from Python."
    
    # SMTP Configuration (example for Gmail)
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SENDER_EMAIL = "pay.wazasolutions@gmail.com"
    SENDER_PASSWORD = "bpsn qyqu mynf lhsv"  # Use app password for Gmail
    
    # Send emails
    results = send_emails_with_logging(
        email_list=EMAIL_LIST,
        subject=SUBJECT,
        body=BODY,
        smtp_server=SMTP_SERVER,
        smtp_port=SMTP_PORT,
        sender_email=SENDER_EMAIL,
        sender_password=SENDER_PASSWORD,
        log_dir="email_logs"
    )
    
    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total emails attempted: {len(EMAIL_LIST)}")
    print(f"Successfully sent: {results['sent_count']}")
    print(f"Failed: {results['failed_count']}")
    print("=" * 60)