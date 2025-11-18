from dotenv import load_dotenv
import os
import json
import time
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth, helpers
import boto3
from typing import Tuple

load_dotenv()

def get_opensearch_client():
    opensearch_host = os.getenv('OPENSEARCH_CLUSTER_HOST')
    if not opensearch_host:
        raise ValueError("OPENSEARCH_CLUSTER_HOST not set")
    opensearch_host = opensearch_host.replace('https://', '').replace('http://', '').strip()
    aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    aws_session_token = os.getenv('AWS_SESSION_TOKEN')
    region = os.getenv('AWS_REGION', 'us-east-1')
    session = boto3.Session(
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        aws_session_token=aws_session_token,
        region_name=region
    )
    credentials = session.get_credentials()
    auth = AWSV4SignerAuth(credentials, region, 'es')
    client = OpenSearch(
        hosts=[{'host': opensearch_host, 'port': 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=20,
        timeout=120,
        connection_timeout=30
    )
    client.info()
    return client

SOURCE_INDEX = "restored_video_clips_consolidated"
TARGET_INDEX = "video_clips_consolidated"
client = get_opensearch_client()

def ensure_target_index_exists(client: OpenSearch, source_index: str, target_index: str) -> bool:
    if client.indices.exists(index=target_index):
        return True
    src_mapping = client.indices.get_mapping(index=source_index)[source_index]['mappings']
    src_settings = client.indices.get_settings(index=source_index)[source_index]['settings']['index']
    keep_keys = [
        'knn',
        'number_of_shards',
        'number_of_replicas',
        'knn.algo_param.ef_search',
        'refresh_interval',
        'codec'
    ]
    filtered_settings = {k: v for k, v in src_settings.items() if k in keep_keys}
    body = {
        'settings': { 'index': filtered_settings },
        'mappings': src_mapping
    }
    client.indices.create(index=target_index, body=body)
    return True


def try_reindex(client: OpenSearch, source_index: str, target_index: str) -> Tuple[bool, dict]:
    try:
        body = { 'source': { 'index': source_index }, 'dest': { 'index': target_index, 'op_type': 'create' } }
        params = { 'wait_for_completion': 'true', 'conflicts': 'proceed', 'refresh': 'true', 'slices': 'auto' }
        res = client.transport.perform_request('POST', '/_reindex', params=params, body=body)
        return True, res
    except Exception as e:
        return False, { 'error': str(e) }


def bulk_copy(client: OpenSearch, source_index: str, target_index: str, batch_size: int = 1000) -> dict:
    total = 0
    created = 0
    errors = 0
    start = time.time()
    scan_iter = helpers.scan(
        client,
        index=source_index,
        query={ 'query': { 'match_all': {} } },
        size=batch_size,
        scroll='2m'
    )

    def gen_actions():
        for hit in scan_iter:
            yield {
                '_op_type': 'create',
                '_index': target_index,
                '_id': hit.get('_id'),
                '_source': hit.get('_source', {})
            }

    for ok, info in helpers.streaming_bulk(
        client,
        gen_actions(),
        chunk_size=500,
        request_timeout=120,
        raise_on_error=False,
    ):
        total += 1
        if ok:
            created += 1
        else:
            errors += 1

    return {
        'took_sec': round(time.time() - start, 2),
        'total_attempted': total,
        'created': created,
        'errors': errors
    }

start = time.time()
ensure_target_index_exists(client, SOURCE_INDEX, TARGET_INDEX)
ok, res = try_reindex(client, SOURCE_INDEX, TARGET_INDEX)
if not ok:
    res = bulk_copy(client, SOURCE_INDEX, TARGET_INDEX)
    method = 'bulk'
else:
    method = 'reindex'
src_cnt = int(client.cat.count(index=SOURCE_INDEX, format='json')[0]['count'])
dst_cnt = int(client.cat.count(index=TARGET_INDEX, format='json')[0]['count'])
summary = {
    'method': method,
    'source_index': SOURCE_INDEX,
    'target_index': TARGET_INDEX,
    'source_count': src_cnt,
    'target_count': dst_cnt,
    'took_sec': round(time.time() - start, 2),
    'details': res
}
print(json.dumps(summary, indent=2))