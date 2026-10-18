# Friction‑Track: Internal UX Auditing for Teams

Team alpha — spec §3.2 hackathon build.

**One-liner:** A friction‑tracking platform that blends user‑submitted Slack reports, optional passive telemetry, and compliance‑aware analytics into a single, auto‑ticketing workflow with priority scoring and audit‑ready dashboards.

**Problem:** In large enterprises, employees routinely hit hidden inefficiencies in internal tools—extra clicks, confusing flows, or accidental data exposure—yet they lack a reliable, low‑barrier way to surface these pains. The current reliance on ad‑hoc emails or sticky notes means many friction points never reach product owners, and compliance teams lack evidence of continuous improvement, exposing the company to audit risk.

**Solution:** Deploy a lightweight Slack‑bot for instant reporting, complemented by an optional browser extension or in‑app prompt that auto‑captures micro‑signals (e.g., hesitation, duplicate clicks). Each report is enriched with telemetry and a lightweight risk‑scoring engine that flags accessibility, data‑privacy, or regulatory concerns. Issues are auto‑translated into tickets in Jira/Trello with suggested owners and priority levels. An AI‑driven prioritizer ranks tickets by frequency, impact, and ownership readiness. A compliance dashboard tracks resolution timelines against statutory reporting windows, providing audit evidence and highlighting high‑risk friction for rapid remediation. When Slack is unavailable, a fallback web/mobile form submits directly to the same pipeline. This end‑to‑end system ensures visibility for all users, quantifiable impact, and regulatory alignment.

**Build scope:** **Day 4‑5 Architecture – Friction‑Track**  
*Keep it lean; everything must be replace‑able with a simple webhook pipeline if a piece fails.*

**Tech stack (core)**  
- **Backend**: Node 18 (Express) on AWS Lambda (cost‑effective, auto‑scales)  
- **Data store**: DynamoDB (fast key‑value for reports) + S3 for raw telemetry blobs  
- **Bot layer**: Slack Bolt SDK (Node) running as a Lambda‑triggered HTTP endpoint  
- **Browser extension**: Chrome/Edge Manifest 3, written in TypeScript, posts JSON to the same Lambda via a pre‑signed API‑Gateway URL  
- **AI/Scoring**: OpenAI gpt‑4o‑mini (via Azure OpenAI) for prioritization prompts; lightweight rule‑engine in Lambda for regulatory flags  
- **Dashboard**: React 18 + Vite, hosted on AWS Amplify, reads from DynamoDB via GraphQL (AppSync)  

**Three minimal components for Day 4‑5**  
1. **Slack‑Bot Service** – slash command `/friction`, modal UI, stores report + optional screenshot URL.  
2. **Ingestion API** – single Lambda endpoint that accepts bot payloads *and* extension telemetry, runs rule‑based risk scoring, writes to DynamoDB, and fires an async SNS event.  
3. **Ticket‑Bridge Worker** – SNS‑triggered Lambda that maps the DynamoDB record to Jira/Trello REST API, adds labels for risk categories, and pushes a minimal payload to the compliance dashboard.

**Top 2 Risks & Mitigations**  
- **Data‑privacy leakage** (screenshots, UI state). Mitigate: encrypt blobs at rest (S3 SSE‑KMS), enforce org‑wide OAuth scopes, and auto‑delete after 90 days.  
- **User adoption fatigue** – if reporting feels noisy, data dries up. Mitigate: one‑click modal, auto‑populate context, and a “quick‑ack” button that logs without opening a modal.

**Fallback Scope (if Bot/Extension stalls)**  
- Deploy a static web form (React hosted on Amplify) that POSTs to the same Ingestion API.  
- Disable AI prioritizer; rely solely on rule‑based risk scores.  
- Export tickets to CSV for manual upload to Jira/Trello.

All pieces are version‑controlled in a single monorepo, enabling rapid rollback and iterative rollout.

**How to run:**
```bash
# Install dependencies
npm ci

# Start the development server
npm run dev
# or: npm start

# Verify it works:
curl http://localhost:3000/health
# => {"status":"ok"}

# Test the ingestion API:
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "description": "The button is hard to find"}'
# => {"id": "...", "status": "received", "riskScore": 0, "riskLevel": "low", "riskFactors": []}
```

Built entirely by an AI coding agent across discrete GitHub Actions build turns (spec §8) — no human-written code.
