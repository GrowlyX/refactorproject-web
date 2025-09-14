#!/usr/bin/env python3
"""
Example Python script showing how to use the Internal GitHub Token API
to perform git operations on user repositories.

This is for INTERNAL USE ONLY - requires the same INTERNAL_API_KEY
as your Next.js application.
"""

import requests
import subprocess
import json
import os
import tempfile
from typing import Dict, Any, Optional

class InternalGitHubClient:
    """Internal client for interacting with the GitHub Token API"""
    
    def __init__(self, base_url: str, internal_api_key: str):
        self.base_url = base_url.rstrip('/')
        self.internal_api_key = internal_api_key
    
    def get_tokens(self, repository_id: int = None, organization_name: str = None, repository_name: str = None) -> Dict[str, Any]:
        """Get GitHub App token and installation token for a repository"""
        if repository_id:
            # Search by repository ID
            payload = {
                "repositoryId": repository_id,
                "internalApiKey": self.internal_api_key
            }
        else:
            # Search by organization and repository name
            payload = {
                "organizationName": organization_name,
                "repositoryName": repository_name,
                "internalApiKey": self.internal_api_key
            }
        
        response = requests.post(
            f"{self.base_url}/api/github/tokens",
            json=payload
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to get tokens: {response.json()}")
    
    def clone_repository(self, repository_id: int = None, organization_name: str = None, repository_name: str = None, local_path: str = None) -> Dict[str, Any]:
        """Clone repository using installation token"""
        token_data = self.get_tokens(repository_id, organization_name, repository_name)
        
        # Construct clone URL with installation token
        repo_url = token_data['repositoryUrl']
        clone_url = f"https://x-access-token:{token_data['installationToken']}@{repo_url.replace('https://', '')}"
        
        # Clone repository
        result = subprocess.run([
            "git", "clone", clone_url, local_path
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Git clone failed: {result.stderr}")
        
        print(f"✅ Cloned {token_data['repositoryName']} to {local_path}")
        return token_data
    
    def create_branch(self, repo_path: str, branch_name: str) -> None:
        """Create a new branch"""
        result = subprocess.run([
            "git", "checkout", "-b", branch_name
        ], cwd=repo_path, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Failed to create branch: {result.stderr}")
        
        print(f"✅ Created branch: {branch_name}")
    
    def commit_changes(self, repo_path: str, message: str) -> None:
        """Commit changes to the repository"""
        # Add all changes
        subprocess.run(["git", "add", "."], cwd=repo_path, check=True)
        
        # Commit changes
        result = subprocess.run([
            "git", "commit", "-m", message
        ], cwd=repo_path, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Failed to commit: {result.stderr}")
        
        print(f"✅ Committed changes: {message}")
    
    def push_branch(self, repo_path: str, branch_name: str) -> None:
        """Push branch to remote"""
        result = subprocess.run([
            "git", "push", "origin", branch_name
        ], cwd=repo_path, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Failed to push branch: {result.stderr}")
        
        print(f"✅ Pushed branch: {branch_name}")
    
    def create_pull_request(self, repository_id: int = None, organization_name: str = None, repository_name: str = None, 
                           title: str = None, head_branch: str = None, base_branch: str = "main") -> Dict[str, Any]:
        """Create pull request using GitHub API"""
        token_data = self.get_tokens(repository_id, organization_name, repository_name)
        
        headers = {
            "Authorization": f"token {token_data['githubAppToken']}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        data = {
            "title": title,
            "head": head_branch,
            "base": base_branch,
            "body": "This PR was created automatically by the internal Python API service."
        }
        
        response = requests.post(
            f"https://api.github.com/repos/{token_data['organizationName']}/{token_data['repositoryName']}/pulls",
            headers=headers,
            json=data
        )
        
        if response.status_code == 201:
            pr_data = response.json()
            print(f"✅ Created PR: {pr_data['html_url']}")
            return pr_data
        else:
            raise Exception(f"Failed to create PR: {response.json()}")
    
    def make_file_changes(self, repo_path: str, file_path: str, content: str) -> None:
        """Make changes to a file in the repository"""
        full_path = os.path.join(repo_path, file_path)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Write content to file
        with open(full_path, 'w') as f:
            f.write(content)
        
        print(f"✅ Modified file: {file_path}")


def main():
    """Example usage of the InternalGitHubClient"""
    
    # Configuration - INTERNAL USE ONLY
    BASE_URL = "http://localhost:3000"
    INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
    
    if not INTERNAL_API_KEY:
        print("❌ INTERNAL_API_KEY environment variable not set")
        print("   Set it with: export INTERNAL_API_KEY='your_static_key_here'")
        return
    
    # Initialize client
    client = InternalGitHubClient(BASE_URL, INTERNAL_API_KEY)
    
    try:
        # Option 1: Use repository ID (replace with actual repository ID from your database)
        # repository_id = 1
        # print(f"📁 Working with repository ID: {repository_id}")
        
        # Option 2: Use organization and repository name (more user-friendly)
        organization_name = "myorg"  # Replace with actual organization name
        repository_name = "myrepo"  # Replace with actual repository name
        print(f"📁 Working with repository: {organization_name}/{repository_name}")
        
        # Create temporary directory for cloning
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_path = os.path.join(temp_dir, "test-repo")
            
            # Clone repository by org/repo name
            print(f"📥 Cloning repository...")
            token_data = client.clone_repository(
                organization_name=organization_name, 
                repository_name=repository_name, 
                local_path=repo_path
            )
            
            print(f"   Repository: {token_data['organizationName']}/{token_data['repositoryName']}")
            print(f"   Token expires: {token_data['expiresAt']}")
            
            # Create a new branch
            branch_name = "python-api-changes"
            client.create_branch(repo_path, branch_name)
            
            # Make some changes
            print("✏️  Making changes...")
            client.make_file_changes(
                repo_path, 
                "python-api-example.txt", 
                "This file was created by the internal Python API service!\n\nTimestamp: " + 
                subprocess.run(["date"], capture_output=True, text=True).stdout.strip()
            )
            
            # Commit changes
            client.commit_changes(repo_path, "Add Python API example file")
            
            # Push branch
            client.push_branch(repo_path, branch_name)
            
            # Create pull request by org/repo name
            pr = client.create_pull_request(
                organization_name=organization_name,
                repository_name=repository_name,
                title="Internal Python API Integration Example",
                head_branch=branch_name,
                base_branch="main"
            )
            
            print(f"\n🎉 Successfully created PR: {pr['html_url']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()
