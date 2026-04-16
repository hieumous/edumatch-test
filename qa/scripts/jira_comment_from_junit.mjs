import fs from "node:fs";

function getEnv(name) {
  return process.env[name]?.trim() || "";
}

function parseJUnitSummary(xml) {
  // Works with Newman junit reporter output which usually contains <testsuites> with one <testsuite ...>
  // We avoid adding deps by reading attributes from the first <testsuite ...> we find.
  const suiteMatch = xml.match(/<testsuite\b([^>]*)>/i);
  if (!suiteMatch) {
    return { tests: null, failures: null, errors: null, skipped: null };
  }
  const attrs = suiteMatch[1];
  const get = (k) => {
    const m = attrs.match(new RegExp(`\\b${k}="([^"]*)"`, "i"));
    return m ? Number(m[1]) : null;
  };
  return {
    tests: get("tests"),
    failures: get("failures"),
    errors: get("errors"),
    skipped: get("skipped"),
    time: (() => {
      const m = attrs.match(/\btime="([^"]*)"/i);
      return m ? Number(m[1]) : null;
    })(),
  };
}

async function jiraComment({ baseUrl, email, apiToken, issueKey, body }) {
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`;
  const auth = Buffer.from(`${email}:${apiToken}`, "utf8").toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: body }],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jira comment failed: ${res.status} ${res.statusText} ${text}`);
  }
}

const junitPath = process.argv[2] ?? "qa/reports/newman/junit.xml";

const baseUrl = getEnv("JIRA_BASE_URL");
const email = getEnv("JIRA_EMAIL");
const apiToken = getEnv("JIRA_API_TOKEN");
const issueKey = getEnv("JIRA_ISSUE_KEY");

if (!baseUrl || !email || !apiToken || !issueKey) {
  console.log("Skipping Jira comment because one or more required env vars are missing.");
  console.log(JSON.stringify({
    hasBaseUrl: Boolean(baseUrl),
    hasEmail: Boolean(email),
    hasApiToken: Boolean(apiToken),
    hasIssueKey: Boolean(issueKey),
  }));
  process.exit(0);
}

const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null;

const sha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : null;
const refName = process.env.GITHUB_REF_NAME ?? null;

const xml = fs.readFileSync(junitPath, "utf8");
const s = parseJUnitSummary(xml);

const total = s.tests ?? "unknown";
const failures = (s.failures ?? 0) + (s.errors ?? 0);
const status = failures > 0 ? "FAIL" : "PASS";

const parts = [
  `[QA Smoke] ${status}`,
  `tests=${total}`,
  `failures=${failures}`,
  s.skipped != null ? `skipped=${s.skipped}` : null,
  s.time != null ? `time=${s.time}s` : null,
  sha ? `sha=${sha}` : null,
  refName ? `ref=${refName}` : null,
  runUrl ? `run=${runUrl}` : null,
].filter(Boolean);

await jiraComment({
  baseUrl,
  email,
  apiToken,
  issueKey,
  body: parts.join(" | "),
});

