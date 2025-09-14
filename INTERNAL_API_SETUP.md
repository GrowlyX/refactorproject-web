# Internal GitHub Token API Setup

This is an **INTERNAL-ONLY** API for generating GitHub installation tokens for your Python API service.

## Environment Setup

### 1. Set Internal API Key

Add this to your `.env.local` file:

```bash
# Internal API Key - Keep this secret!
INTERNAL_API_KEY=your_super_secret_static_key_here
```

**Important**: This key should be:
- A long, random string (at least 32 characters)
- Only known by your Next.js app and Python API
- Never exposed to the public or logged

### 2. Generate a Secure Key

You can generate a secure key using:

```bash
# Generate a random 64-character key
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Usage

### From Your Python API

```python
import os
import requests

# Get the same key from environment
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

# Call the internal API - Option 1: By Repository ID
response = requests.post(
    "http://localhost:3000/api/github/tokens",
    json={
        "repositoryId": 5,  # Repository ID from your database
        "internalApiKey": INTERNAL_API_KEY
    }
)

# Call the internal API - Option 2: By Organization and Repository Name
response = requests.post(
    "http://localhost:3000/api/github/tokens",
    json={
        "organizationName": "myorg",  # Organization name
        "repositoryName": "myrepo",   # Repository name
        "internalApiKey": INTERNAL_API_KEY
    }
)

if response.status_code == 200:
    tokens = response.json()
    print(f"GitHub App Token: {tokens['githubAppToken']}")
    print(f"Installation Token: {tokens['installationToken']}")
    print(f"Repository: {tokens['organizationName']}/{tokens['repositoryName']}")
else:
    print(f"Error: {response.json()}")
```

### Git Operations

```bash
# Clone with installation token
git clone https://x-access-token:YOUR_INSTALLATION_TOKEN@github.com/org/repo.git

# Push changes
git push origin feature-branch

# Create PR via GitHub API
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_APP_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/org/repo/pulls \
  -d '{"title":"My PR","head":"feature-branch","base":"main"}'
```

## Security Notes

1. **Internal Only**: This API is not meant for public use
2. **Static Key**: Uses a single static key for simplicity
3. **Token Expiration**: Installation tokens expire after 1 hour
4. **Repository Validation**: Only works with repositories where GitHub App is installed
5. **No Public Access**: No public endpoints or user authentication

## Testing

Run the test script to verify everything works:

```bash
# Set the internal API key
export INTERNAL_API_KEY="your_static_key_here"

# Run the test
node test-token-api.js
```

## Error Handling

Common errors and solutions:

- **401 Unauthorized**: Check that `INTERNAL_API_KEY` matches in both services
- **404 Repository not found**: 
  - If using repository ID: Verify repository ID exists in database
  - If using org/repo names: Verify organization name and repository name exist and match exactly
- **400 GitHub App not installed**: Ensure GitHub App is installed for the organization
- **400 Missing parameters**: Either provide `repositoryId` OR both `organizationName` and `repositoryName`
- **500 Internal server error**: Check GitHub App configuration and database connection
