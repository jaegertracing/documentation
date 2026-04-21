#!/usr/bin/env python3

# Copyright (c) 2024 The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0

# This script generates the roadmap.md file from the issues in the "Roadmap" GitHub Project.

import json
import logging
import os
import re
import subprocess
import urllib.request

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Try to get token from gh CLI first, then env var, then file
GITHUB_TOKEN = None
logger.info("Looking for GitHub token...")
try:
    result = subprocess.run(
        ["gh", "auth", "token"], capture_output=True, text=True, check=True, timeout=5
    )
    GITHUB_TOKEN = result.stdout.strip()
    logger.info("Using token from gh CLI")
except subprocess.TimeoutExpired:
    logger.warning("gh auth token timed out, trying other sources")
except FileNotFoundError:
    logger.warning("gh CLI not found, trying other sources")
except subprocess.CalledProcessError as e:
    logger.warning("gh auth token failed (exit %d): %s", e.returncode, e.stderr.strip())

if not GITHUB_TOKEN:
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    if GITHUB_TOKEN:
        logger.info("Using token from GITHUB_TOKEN env var")
if not GITHUB_TOKEN:
    try:
        with open(os.path.expanduser("~/.github_token"), "r") as token_file:
            GITHUB_TOKEN = token_file.read().strip()
        logger.info("Using token from ~/.github_token")
    except FileNotFoundError:
        logger.error(
            "No GitHub token found: gh auth token failed, GITHUB_TOKEN env var not set, and ~/.github_token not found"
        )
        exit(1)

QUERY = """
{
  organization(login: "jaegertracing") {
    projectV2(number: 4) {
      id
      title
      items(first: 100) {
        nodes {
          id
          type
          content {
            ... on Issue {
              title
              state
              url
              body
            }
          }
        }
      }
    }
  }
}
"""


def _graphql_request(query):
    logger.info("Executing GraphQL query...")
    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }
    data = json.dumps({"query": query}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        logger.error(f"HTTP Error: {e.code} {e.reason}")
        logger.error(f"Response body: {e.read().decode('utf-8')}")
        raise


def fetch_issues():
    result = _graphql_request(QUERY)

    if "errors" in result:
        for error in result["errors"]:
            logger.error(f"GitHub API error: {error.get('message', 'Unknown error')}")
            if error.get("type") == "INSUFFICIENT_SCOPES":
                logger.error(
                    "Token lacks 'read:project' scope. Run: gh auth refresh -s read:project"
                )

    if "data" not in result or not result["data"]:
        raise ValueError("GitHub API response missing 'data' field or it is null.")

    organization = result["data"].get("organization")
    if not organization:
        raise ValueError("GitHub API response missing 'organization' data.")

    project = organization.get("projectV2")
    if not project:
        raise ValueError("GitHub API response missing 'projectV2' data. Ensure project number is correct.")

    issues = project["items"]["nodes"]
    return [
        {
            "title": issue["content"]["title"],
            "state": issue["content"]["state"],
            "url": issue["content"]["url"],
            "body": issue["content"]["body"],
        }
        for issue in issues
        if issue["type"] == "ISSUE"
    ]


def extract_summary(body):
    summary_index = body.find("## Summary")
    if summary_index == -1:
        logger.info("🔴 summary not found")
        return None
    summary_start = summary_index + len("## Summary")
    next_section_index = body.find("##", summary_start)
    if next_section_index == -1:
        return body[summary_start:].strip()
    return body[summary_start:next_section_index].strip()


def generate_roadmap(issues):
    roadmap_content = "---\n"
    roadmap_content += "title: Roadmap\n"
    roadmap_content += "type: docs\n"
    roadmap_content += "weight: 70\n"
    roadmap_content += "---\n\n"
    roadmap_content += (
        "The following is a summary of the major features we plan to implement.\n"
    )
    roadmap_content += "For more details, see the [Roadmap on GitHub](https://github.com/orgs/jaegertracing/projects/4/views/1?layout=table).\n\n"
    for issue in issues:
        title = re.sub(r"^\[Feature\]:?\s*", "", issue["title"]).strip()
        logger.info("  💡 %s", title)
        roadmap_content += f"## {title}\n\n"
        summary = extract_summary(issue["body"])
        text = (summary or issue["body"])
        lines = "\n".join(line.rstrip() for line in text.splitlines())
        roadmap_content += f"{lines}\n\n"
        roadmap_content += (
            f"For more information see the [issue description]({issue['url']}).\n\n"
        )
    return roadmap_content


def save_roadmap(content):
    with open("content/roadmap.md", "w") as f:
        f.write(content)


def main():
    try:
        issues = fetch_issues()
        roadmap_content = generate_roadmap(issues)
        save_roadmap(roadmap_content)
        logger.info("Roadmap generated successfully")
    except Exception as e:
        logger.error(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
