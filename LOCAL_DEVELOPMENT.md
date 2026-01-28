# 💻 Local Development Guide

**Note: Local development is completely optional!** The application works perfectly when deployed through GitHub Actions. This guide is only for developers who want to run the frontend locally or customize the application.

## Prerequisites

- **Node.js 18+** (for frontend development)
- **AWS CLI** configured (optional, for direct AWS access)
- **Git** (to clone the repository)

---

## Option 1: Local Frontend with Deployed Backend (Recommended)

This is the easiest way to develop locally - deploy the backend via GitHub Actions and run only the frontend locally.

### Step 1: Deploy Backend via GitHub Actions

1. Follow the **Quick Deploy** steps in the [README](README.md) to deploy the infrastructure
2. After deployment completes, **get your API URL** from the deployment summary:
   - Go to **Actions** → Click your completed workflow
   - Scroll down and click **"deployment-summary"**
   - Copy the **API URL** (e.g., `https://d3t7mkf40gd4.cloudfront.net`)

### Step 2: Set Up Local Frontend

```bash
# Clone your forked repository
git clone https://github.com/YOUR-USERNAME/search-videos.git
cd search-videos/frontend

# Install dependencies
npm install

# Create local environment file
cp .env.example .env
```

### Step 3: Configure Backend URL

Edit `frontend/.env` and set your deployed backend API URL:

```env
VITE_API_BASE_URL=https://d3t7mkf40gd4.cloudfront.net
```

Replace with your actual API URL from the deployment summary.

### Step 4: Run Frontend Locally

```bash
npm run dev
```

Your frontend will be available at `http://localhost:5173` and will connect to your deployed AWS backend.

**Benefits:**
- ✅ No AWS credentials needed locally
- ✅ Fast frontend development with hot reload
- ✅ Uses real AWS infrastructure (OpenSearch, S3, Bedrock)
- ✅ No Docker or complex setup required

---

## Option 2: Deploy Backend Stack Directly (Alternative)

If GitHub Actions deployment doesn't work or you prefer direct AWS deployment:

### Step 1: Deploy Backend via AWS CLI

```bash
# Set your configuration
export STACK_PREFIX="vs-1"
export ENVIRONMENT="demo"
export AWS_REGION="us-east-1"

# Upload template to S3 (required for large templates)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
TEMPLATE_BUCKET="aws-cloudformation-templates-${ACCOUNT_ID}-${AWS_REGION}"
TEMPLATE_KEY="video-search-backend-$(date +%s).yaml"

# Create bucket if needed
aws s3 mb "s3://${TEMPLATE_BUCKET}" --region "${AWS_REGION}" 2>/dev/null || true

# Upload template
aws s3 cp video-search-cloudformation-stack.yaml "s3://${TEMPLATE_BUCKET}/${TEMPLATE_KEY}"

# Deploy stack
aws cloudformation create-stack \
  --stack-name "${STACK_PREFIX}-${ENVIRONMENT}-backend" \
  --template-url "https://${TEMPLATE_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${TEMPLATE_KEY}" \
  --parameters \
    ParameterKey=env,ParameterValue="${ENVIRONMENT}" \
    ParameterKey=StackPrefix,ParameterValue="${STACK_PREFIX}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${AWS_REGION}"

# Wait for completion (15-20 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name "${STACK_PREFIX}-${ENVIRONMENT}-backend" \
  --region "${AWS_REGION}"

# Get outputs
aws cloudformation describe-stacks \
  --stack-name "${STACK_PREFIX}-${ENVIRONMENT}-backend" \
  --query 'Stacks[0].Outputs' \
  --region "${AWS_REGION}"

# Cleanup temporary S3 resources
aws s3 rm "s3://${TEMPLATE_BUCKET}/${TEMPLATE_KEY}"
aws s3 rb "s3://${TEMPLATE_BUCKET}" 2>/dev/null || true
```

### Step 2: Get API URL from Stack Outputs

```bash
# Get the API URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_PREFIX}-${ENVIRONMENT}-backend" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiCloudFrontURL`].OutputValue' \
  --output text \
  --region "${AWS_REGION}")

echo "Your API URL: $API_URL"
```

### Step 3: Configure and Run Frontend

Follow the same steps as Option 1 (Steps 2-4) to set up and run the frontend locally with your API URL.

---

## Option 3: Build and Deploy Frontend Manually

If you want to build and deploy the frontend separately:

### Step 1: Build Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

This creates optimized files in `frontend/dist/`.

### Step 2: Create Runtime Configuration

```bash
cd dist

# Create config.json with your backend URL
cat > config.json << EOF
{
  "backendUrl": "https://YOUR-API-URL.cloudfront.net",
  "apiVersion": "v1",
  "environment": "demo",
  "features": {
    "marengo3Enabled": true,
    "uploadEnabled": true,
    "maxUploadSizeMB": 500
  },
  "endpoints": {
    "search": "/search",
    "search3": "/search-3",
    "list": "/list",
    "upload": "/generate-upload-presigned-url",
    "health": "/health"
  }
}
EOF
```

Replace `YOUR-API-URL` with your actual backend API URL.

### Step 3: Deploy to S3 (Option A - Using AWS CLI)

```bash
# Get your frontend bucket name from CloudFormation
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "video-search-frontend-demo" \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text \
  --region "${AWS_REGION}")

# Upload static assets with long cache
aws s3 sync . "s3://${FRONTEND_BUCKET}" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "config.json"

# Upload HTML files with no cache
aws s3 sync . "s3://${FRONTEND_BUCKET}" \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# Upload config.json with no cache
aws s3 cp config.json "s3://${FRONTEND_BUCKET}/config.json" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/json"

# Invalidate CloudFront cache
CF_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "video-search-frontend-demo" \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text \
  --region "${AWS_REGION}")

aws cloudfront create-invalidation \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --paths "/*"
```

### Step 4: Deploy to S3 (Option B - Manual Upload)

1. Go to **AWS Console** → **S3**
2. Find your frontend bucket (e.g., `video-search-frontend-demo-123456789012`)
3. Upload all files from `frontend/dist/`
4. Go to **CloudFront** → Find your distribution
5. Create an invalidation for `/*`

---

## Local Development Tips

### Frontend Hot Reload

```bash
cd frontend
npm run dev
# Changes auto-reload at http://localhost:5173
```

### Check Backend Health

```bash
curl https://YOUR-API-URL.cloudfront.net/health
```

### View Application Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/vs-1-demo-invoke-bedrock-marengo --follow

# ECS logs
aws logs tail /ecs/vs-1-demo-search-similar-videos-task --follow

# Store embeddings logs
aws logs tail /aws/lambda/vs-1-demo-store-embeddings-opensearch --follow
```

### Test API Endpoints

```bash
# Health check
curl https://YOUR-API-URL.cloudfront.net/health

# List videos
curl https://YOUR-API-URL.cloudfront.net/list

# Search (POST request)
curl -X POST https://YOUR-API-URL.cloudfront.net/search \
  -H "Content-Type: application/json" \
  -d '{"query": "person walking", "top_k": 5}'
```

### Common Issues

1. **CORS errors**: 
   - Make sure your backend URL in `.env` matches exactly (no trailing slash)
   - Check that the backend is fully deployed and healthy

2. **404 errors**: 
   - Verify the backend stack is fully deployed
   - Check CloudFormation stack status
   - Ensure API Gateway/CloudFront is properly configured

3. **Upload fails**: 
   - Verify S3 bucket permissions
   - Check presigned URL generation in Lambda logs
   - Ensure CORS is configured on the S3 bucket

4. **Search returns no results**:
   - Check that videos have been processed
   - Verify embeddings are stored in OpenSearch
   - Check OpenSearch cluster health

5. **Slow performance**:
   - Check CloudWatch metrics for Lambda/ECS
   - Verify OpenSearch cluster isn't overloaded
   - Check network latency to AWS region

---

## Backend Development (Advanced)

Backend services run on AWS. For local backend development:

### Lambda Functions

Located in `backend/AWS Lambda Functions/`:

- **invoke-bedrock-marengo.py**: Triggers Bedrock video processing
- **store-embeddings-opensearch-lambda.py**: Stores embeddings in OpenSearch
- **search-lambda.py**: Handles search queries
- **create_opensearch_snapshot.py**: Creates OpenSearch snapshots

**Testing locally:**
```bash
# Use AWS SAM for local testing
sam local invoke InvokeBedrockMarengoFunction \
  --event test-events/video-upload.json

# Or deploy individual functions for testing
aws lambda update-function-code \
  --function-name vs-1-demo-invoke-bedrock-marengo \
  --zip-file fileb://function.zip
```

### ECS Services

Located in `backend/*/`:

1. **landingzone to raw - ECS Fargate**: Video preprocessing
2. **search-similar-videos - ECS Fargate**: Search API service

**Docker images are pre-built and public**. For custom changes:

```bash
# Build custom image
cd backend/search-similar-videos\ -\ ECS\ Fargate
docker build -t my-search-service .

# Push to your ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag my-search-service:latest YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/my-search-service:latest
docker push YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/my-search-service:latest

# Update task definition to use your image
```

### Infrastructure Changes

Edit `video-search-cloudformation-stack.yaml` or `frontend-cloudformation-stack.yaml`:

```bash
# Validate template
aws cloudformation validate-template \
  --template-body file://video-search-cloudformation-stack.yaml

# Deploy updates via GitHub Actions or AWS CLI
aws cloudformation update-stack \
  --stack-name vs-1-demo-backend \
  --template-body file://video-search-cloudformation-stack.yaml \
  --parameters \
    ParameterKey=env,ParameterValue=demo \
    ParameterKey=StackPrefix,ParameterValue=vs-1 \
  --capabilities CAPABILITY_NAMED_IAM
```

---

## Development Workflow

### Typical Frontend Development Flow

1. **Deploy backend** via GitHub Actions (one-time setup)
2. **Get API URL** from deployment summary
3. **Configure local frontend** with API URL
4. **Run `npm run dev`** for hot reload development
5. **Make changes** to React components
6. **Test locally** at `http://localhost:5173`
7. **Build and deploy** when ready: `npm run build` → upload to S3

### Typical Backend Development Flow

1. **Make changes** to Lambda functions or ECS services
2. **Test locally** using AWS SAM or Docker
3. **Deploy to AWS** for integration testing
4. **Monitor logs** in CloudWatch
5. **Update CloudFormation** if infrastructure changes needed
6. **Deploy via GitHub Actions** for full stack updates

---

## Debugging Tips

### Enable Verbose Logging

**Frontend:**
```javascript
// In frontend/src/services/api.js
console.log('API Request:', url, options);
console.log('API Response:', response);
```

**Backend Lambda:**
```python
# In Lambda functions
import logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
logger.debug(f"Processing: {event}")
```

### Check CloudFormation Events

```bash
# View stack events
aws cloudformation describe-stack-events \
  --stack-name vs-1-demo-backend \
  --max-items 20

# Check stack status
aws cloudformation describe-stacks \
  --stack-name vs-1-demo-backend \
  --query 'Stacks[0].StackStatus'
```

### Monitor OpenSearch

```bash
# Check cluster health
curl -X GET "https://YOUR-OPENSEARCH-ENDPOINT/_cluster/health?pretty"

# List indices
curl -X GET "https://YOUR-OPENSEARCH-ENDPOINT/_cat/indices?v"

# Check index mapping
curl -X GET "https://YOUR-OPENSEARCH-ENDPOINT/video-embeddings/_mapping?pretty"
```

---

## Additional Resources

- **AWS Documentation**: 
  - [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)
  - [OpenSearch Service](https://docs.aws.amazon.com/opensearch-service/)
  - [ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
  - [Lambda](https://docs.aws.amazon.com/lambda/)

- **Frontend Development**:
  - [React Documentation](https://react.dev/)
  - [Vite Documentation](https://vitejs.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)

- **Backend Development**:
  - [Python Boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
  - [FastAPI](https://fastapi.tiangolo.com/) (used in ECS services)
  - [OpenSearch Python Client](https://opensearch.org/docs/latest/clients/python/)

---

**Need help?** Open an issue in the repository or check the [main README](README.md) for more information.
