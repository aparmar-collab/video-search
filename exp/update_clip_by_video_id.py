"""Utility script to update a specific column for all documents with a given video_id in OpenSearch."""

import logging
import os
from typing import Optional

import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
from dotenv import load_dotenv
load_dotenv()

# Constants
INDEX_NAME = "video_clips_consolidated"
VIDEO_ID_TO_UPDATE = "c96034b6-eaae-4561-ae41-ab6c72fa326c"  # Replace with actual video_id
COLUMN_TO_UPDATE = "video_duration_sec"  # Replace with column name to update
NEW_VALUE = "30"  # Replace with new value

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def get_opensearch_client() -> OpenSearch:
    """Create an authenticated OpenSearch client using AWS SigV4."""
    opensearch_host = os.environ.get("OPENSEARCH_CLUSTER_HOST", "https://search-condenast-aos-domain-3hmon7me6ct3p5e46snecxe6f4.us-east-1.es.amazonaws.com")
    aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    aws_session_token = os.getenv('AWS_SESSION_TOKEN')  # Optional
    if not opensearch_host:
        raise ValueError("OPENSEARCH_CLUSTER_HOST environment variable not set")

    opensearch_host = opensearch_host.replace("https://", "").replace("http://", "").strip()

    session = boto3.Session(
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            aws_session_token=aws_session_token,
            region_name="us-east-1"
        )
    credentials = session.get_credentials()
    if not credentials:
        raise RuntimeError("Failed to obtain AWS credentials for OpenSearch access")

    auth = AWSV4SignerAuth(credentials, "us-east-1", "es")

    return OpenSearch(
        hosts=[{"host": opensearch_host, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=5,
    )


def update_column_by_video_id(client: OpenSearch, video_id: str, column_name: str, new_value) -> dict:
    """
    Update a specific column for all documents matching a video_id.
    
    Args:
        client: OpenSearch client
        video_id: The video_id to match
        column_name: The field/column to update
        new_value: The new value to set
    
    Returns:
        dict: Update result with count of updated documents
    """
    query = {
        "query": {
            "match": {
                "video_id": video_id
            }
        }
    }
    
    update_body = {
        "script": {
            "source": f"ctx._source.{column_name} = params.new_value",
            "params": {
                "new_value": new_value
            }
        }
    }
    
    try:
        response = client.update_by_query(
            index=INDEX_NAME,
            body={**query, **update_body},
            refresh=True
        )
        
        logger.info(f"✓ Updated {response['updated']} documents")
        logger.info(f"  Column: {column_name}")
        logger.info(f"  New value: {new_value}")
        logger.info(f"  Video ID: {video_id}")
        
        return response
        
    except Exception as e:
        logger.error(f"✗ Error updating documents: {str(e)}", exc_info=True)
        raise


if __name__ == "__main__":
    try:
        logger.info(f"Connecting to OpenSearch index: {INDEX_NAME}")
        client = get_opensearch_client()
        
        logger.info(f"Starting update operation...")
        logger.info(f"  Video ID: {VIDEO_ID_TO_UPDATE}")
        logger.info(f"  Column: {COLUMN_TO_UPDATE}")
        logger.info(f"  New Value: {NEW_VALUE}")
        
        result = update_column_by_video_id(
            client,
            VIDEO_ID_TO_UPDATE,
            COLUMN_TO_UPDATE,
            NEW_VALUE
        )
        
        logger.info(f"Update completed successfully!")
        logger.info(f"Result: {result}")
        
    except Exception as e:
        logger.error(f"Failed to update: {str(e)}", exc_info=True)
        exit(1)