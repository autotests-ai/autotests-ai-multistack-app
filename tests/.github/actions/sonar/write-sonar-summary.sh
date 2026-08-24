#!/usr/bin/env bash
# Leaf sonar actions in this family run this file (not a workflow env: helper).
{
  echo "## ${GITHUB_JOB}"
  echo ""
  echo "- projectKey: \`${SONAR_PROJECT_KEY}\`"
  echo "- host: \`${SONAR_HOST_URL}\`"
  echo "- dashboard: ${SONAR_HOST_URL%/}/dashboard?id=${SONAR_PROJECT_KEY}"
  echo "- commit: \`${GITHUB_SHA:0:7}\`"
} >> "$GITHUB_STEP_SUMMARY"
