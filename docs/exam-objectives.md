# Official exam objectives (from candidate score reports)

Source: Anthropic score reports for CCAR-F and CCAR-P (personal candidate details removed).
Passing score for both: **720 / 1000**. Used to define domain taxonomy, weight mock
exams, and ground the rewrite pipeline. (No official blueprint was available for
CCAO-F or CCDV-F; those use reasonable inferred domains.)

## CCAR-F — Claude Certified Architect, Foundations

Grouped into the app's domains:

**Multi-Agent Orchestration & Subagents**
- Construct subagent prompts that include all findings, structured data, and source metadata needed without returning to the coordinator.
- Evaluate subagent delegation strategies (goal-oriented vs procedural) balancing adaptive behavior with coordinator visibility.
- Configure subagent invocations with tool restrictions, context scoping, and role-constraining system prompts.
- Diagnose misconfigured subagent spawning (missing tool permissions, wrong AgentDefinition params, absent coordinator↔subagent wiring).
- Evaluate multi-agent orchestration patterns (coordinator-worker, parallel, sequential pipelines) for coverage/latency/reliability.
- Configure tool distribution so each subagent gets only the tools its role needs.

**Agentic Workflows & Task Design**
- Configure agentic loops to emit multiple tool calls in one turn for parallel execution of independent subtasks.
- Decompose complex tasks into dynamically generated subtasks that adapt to new findings.
- Select the agentic review architecture (plan mode, direct execution, multi-phase) by scope, risk, approval needs.
- Structure iterative refinement (concrete input-output examples, targeted feedback, batched issues).

**Claude Code Configuration & Tooling**
- Configure Claude Code CLI for CI/CD (non-interactive flags, permission modes, cost/turn limits).
- Design Claude Code review configs (load project standards, restrict tools, structured output).
- Apply `context: fork` frontmatter to Skills/slash commands for isolated subagent context.
- Select the right config mechanism (CLAUDE.md, .claude/rules/ globs, Skills, hooks, settings permissions).
- Select the right built-in tool (Grep, Glob, Read, Bash) for a task.
- Improve automated test generation (existing tests as context, fixture conventions, meaningful vs trivial assertions).

**Context & Session Management**
- Apply session resumption (targeted re-analysis of changed files, context injection) without repeating work.
- Design state persistence for multi-agent pipelines to resume after interruption.
- Apply systematic codebase exploration (Grep/Glob/Read) managing context limits.
- Apply context management (subagent isolation, scratchpad files, targeted reading) across long sessions.
- Apply context window optimization (summarization, sliding windows, structured state, selective retention).

**Structured Output & Tool Use**
- Select the most reliable structured-output method (tool use + JSON schema, prompt formatting, prefilled responses).
- Design extraction schemas with optional/nullable fields and enums to represent missing/ambiguous data without fabricating.
- Implement tool use with JSON schemas; configure `tool_choice` to guarantee invocation.
- Resolve structured-output truncation by splitting scoped calls and merging, not just raising max_tokens.
- Configure `tool_choice` and sequence multi-tool workflows so prerequisites are obtained first.

**MCP & API Integration**
- Distinguish MCP resources vs tools; expose content as resources to reduce exploratory calls.
- Integrate MCP servers (server scope, env-var auth, tool discovery verification).
- Write MCP tool descriptions that distinguish purpose, inputs, boundaries, and relationships.
- Select API processing mode (synchronous Messages API vs asynchronous Message Batches API).

**Review, Extraction & Evaluation**
- Design human-review routing by confidence/document characteristics/field ambiguity (not random sampling).
- Design specialized review passes separating concerns (security, business logic, API design) with dedicated few-shot examples.
- Apply extraction accuracy patterns (structured schemas, format normalization, few-shot) to cut hallucination.
- Reduce automated-review false positives via project conventions/accepted patterns/exclusions as persistent context.
- Design prompt inclusion/exclusion boundaries to avoid unreliable categories.
- Design subagent output schemas suited to downstream synthesis.
- Design synthesis behavior that preserves source-level uncertainty.

## CCAR-P — Claude Certified Architect, Professional

**Solution Design & Architecture**
- Translate business problems into Claude-based AI solutions.
- Design end-to-end architectures (input → processing → output → feedback loops).
- Select architectural patterns (workflow, agentic, augmented LLM).
- Design multi-agent systems and orchestration strategies.
- Align solutions to business value pillars (efficiency, transformation, productivity, cost, SLAs).

**Models, Prompting & Configuration**
- Select appropriate Claude models based on trade-offs.
- Apply prompt engineering (zero-shot, few-shot, chain-of-thought, etc.).
- Evaluate tool/agent configuration for capability bloat.
- Evaluate accuracy-latency trade-offs and justify configuration decisions.

**Security, Compliance & Governance**
- Analyze authentication/authorization requirements to identify security gaps.
- Evaluate connection protocols and select the appropriate integration mechanism.
- Ensure compliance with regulations (GDPR, HIPAA, FedRAMP).

**Safety & Risk**
- Implement guardrails and safety controls.
- Identify risks, limitations, and failure modes of LLM systems.
- Apply human-in-the-loop validation strategies.
- Address ethical AI considerations (bias, fairness, transparency).

**Evaluation & Testing**
- Design evaluation datasets and test frameworks using mixed methodologies.
- Conduct A/B testing and iterative improvements.
- Diagnose system issues (prompt failure, hallucinations, model mismatch).

**Observability & Optimization**
- Analyze observability challenges and select monitoring strategies at scale.
- Optimize token usage, latency, and cost-performance trade-offs.
- Monitor system performance using logging and observability tools.

**Delivery & Stakeholder Management**
- Conduct structured discovery and requirement gathering.
- Communicate architectural decisions and trade-offs.
- Manage stakeholder feedback loops and expectations (including SLAs).
- Document architectures and provide implementation guidance.
- Support lifecycle phases (discovery, design, handoff, monitoring, iteration).

**Developer Enablement**
- Configure Claude tools/environments for teams (e.g., Claude Code).
- Improve developer workflows using AI-assisted tooling.
- Support debugging and operational issue resolution.
