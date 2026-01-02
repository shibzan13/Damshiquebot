import os
import boto3
import logging
from botocore.exceptions import ClientError
from datetime import datetime

logger = logging.getLogger(__name__)

class S3Storage:
    def __init__(self):
        self.bucket_name = os.getenv("AWS_S3_BUCKET")
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "eu-north-1")
        )

    def upload_file(self, local_path, user_id):
        """
        Uploads a file to S3 and returns a permanent URL.
        Path: uploads/{user_id}/{timestamp}_{filename}
        """
        if not self.bucket_name:
            logger.error("AWS_S3_BUCKET not configured")
            return None

        filename = os.path.basename(local_path)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        key = f"invoices/{user_id}/{timestamp}_{filename}"

        try:
            self.s3_client.upload_file(local_path, self.bucket_name, key)
            
            # Generate a public-read URL or signed URL. 
            # For simplicity, assuming bucket allows public access or using a static URL format.
            url = f"https://{self.bucket_name}.s3.{os.getenv('AWS_REGION', 'eu-north-1')}.amazonaws.com/{key}"
            return url
        except ClientError as e:
            logger.error(f"S3 Upload failed for {local_path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected storage error: {e}")
            return None

    def generate_presigned_url(self, s3_url, expiration=3600):
        """
        Converts a permanent S3 URL into a temporary pre-signed URL.
        """
        if not s3_url or "amazonaws.com" not in s3_url:
            return s3_url

        try:
            # Extract key from URL: https://bucket.s3.region.amazonaws.com/key
            parts = s3_url.split(".amazonaws.com/")
            if len(parts) < 2: return s3_url
            key = parts[1]

            params = {
                'Bucket': self.bucket_name,
                'Key': key
            }
            
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expiration
            )
            return response
        except Exception as e:
            logger.error(f"Presigned URL generation failed: {e}")
            return s3_url

# Singleton instance
storage_service = S3Storage()

async def save_raw_invoice(local_path, user_id):
    """
    Wrapper to ensure storage failure doesn't block ingestion.
    Returns URL to access the invoice.
    """
    try:
        url = storage_service.upload_file(local_path, user_id)
        if url:
            print(f"📦 File uploaded to storage: {url}")
            return url
        
        # Fallback to local server URL if S3 not configured
        filename = os.path.basename(local_path)
        return f"/uploads/{filename}"
    except Exception as e:
        logger.error(f"Failed to persist raw invoice: {e}")
        # Final fallback - still return local path if possible
        try:
            filename = os.path.basename(local_path)
            return f"/uploads/{filename}"
        except:
            return None
