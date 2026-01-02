#!/usr/bin/env python3

# Copyright (c) 2024 The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0

# This script generates the roadmap.md file from the issues in the "Roadmap" GitHub Project.

import json
import logging
import os
import urllib.request

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GitHub API token
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    try:
        with open(os.path.expanduser("~/.github_token"), "r") as token_file:
            GITHUB_TOKEN = token_file.read().strip()
    except FileNotFoundError:
        logger.error(
            "GITHUB_TOKEN environment variable not set and ~/.github_token file not found"
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


def fetch_issues():
    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }
    data = json.dumps({"query": QUERY}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            result = json.loads(res_body)
            if "errors" in result:
                for error in result["errors"]:
                    logger.error(f"GitHub API error: {error.get('message', 'Unknown error')}")
                    if error.get("type") == "INSUFFICIENT_SCOPES":
                        logger.error("Please ensure your GITHUB_TOKEN has 'read:project' scope.")

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
    except urllib.error.HTTPError as e:
        logger.error(f"HTTP Error: {e.code} {e.reason}")
        logger.error(f"Response body: {e.read().decode('utf-8')}")
        raise


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
        logger.info(issue["title"])
        roadmap_content += f"## {issue['title']}\n\n"
        summary = extract_summary(issue["body"])
        if summary:
            roadmap_content += f"{summary}\n\n"
        else:
            roadmap_content += f"{issue['body']}\n\n"
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
