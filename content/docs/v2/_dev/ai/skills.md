---
title: Custom Skills
description: Markdown playbooks that teach an agent how to analyze traces, and how Jaeger serves them.
hasparent: true
weight: 3
---

A skill is a markdown playbook that an agent reads before it attempts a trace
analysis task. It carries the judgement a telemetry tool cannot: which of two
similar-looking traces is an N+1, which errored span is the cause and which is
a bystander. The agent supplies the reasoning, and the skill supplies the
procedure worth reasoning about.

Jaeger bundles built-in skills into the binary and serves them through the
`read_skill` tool of the [MCP server](../mcp-server/). An agent starts at the
root `SKILL.md`, which lists the skills with one line each on when to use them,
and follows its links, so a skill is read only when it looks relevant. This page
describes how an operator adds skills for their own installation, and how to
write one that an agent will choose to read.

## Serving your own skills

Point `ai.mcp.skills_dir` at a directory on the query server's disk:

```yaml
extensions:
  jaeger_query:
    ai:
      mcp:
        skills_dir: /etc/jaeger/skills
```

On the embedded all-in-one configuration, set the same field with
`--set extensions.jaeger_query.ai.mcp.skills_dir=<path>`.

The directory must contain a `SKILL.md`, which is the index of your skills.
Jaeger serves the directory under the `custom/` prefix beside the built-in
skills, and the built-in root index links to `custom/SKILL.md`, so an agent that
follows the index reaches your skills:

```
SKILL.md                       # built-in index
detect-n-plus-one/SKILL.md     # built-in skill
custom/SKILL.md                # your index,  <skills_dir>/SKILL.md
custom/your-skill/SKILL.md     # your skill,  <skills_dir>/your-skill/SKILL.md
```

`custom/` is a prefix on the path an agent asks for, not a directory you create.
Below the index, a link may point at any file under any name; one directory per
skill is a convention, not a rule.

The directory is read live, so an edit takes effect on the next `read_skill`
call. Jaeger checks the directory once, at startup, and refuses to start rather
than serve an incomplete skill set:

| Startup error | Cause |
| --- | --- |
| `cannot open skills_dir "…"` | The path is missing, or is not a directory |
| `cannot read SKILL.md in skills_dir "…"` | The directory opens, but has no readable index |

A directory that breaks after startup is reported when an agent reads a skill,
as `cannot read "<path>": …`, not by refusing to serve.

Two limits apply to what is served. A path that leaves the directory through
`..` or a symlink is refused by the operating system, not by a path check. A
served file is cut at 512 KiB and ends with
`file content truncated after 524288 bytes`; the cap is not configurable, and a
skill anywhere near it is far too long to be useful to an agent.

{{% alert title="Warning" color="warning" %}}
Anyone who can write to `skills_dir` can steer the behavior of an agent that
already holds your telemetry tools. Treat the directory as part of the trusted
configuration surface: own it by root or the Jaeger service account, keep it out
of paths writable by application deployments, and review changes to it as you
would review a configuration change.
{{% /alert %}}

To check that the directory is mounted, ask an MCP client attached to the
endpoint to call `read_skill` with the path `custom/SKILL.md`. Your text coming
back means it is reachable. `cannot read "custom/SKILL.md"` means that no
`skills_dir` is configured on this server, or that the file is not there under
that name.

## When a skill is the right answer

Write one when a competent analyst would reach a different conclusion than the
obvious reading of the data, and can say why, as a procedure. If the tools
already answer the question, a skill adds a read for nothing.

Skills are a poor fit for anything that is really a missing tool, a missing
span attribute, or a policy your team enforces elsewhere. They are text an agent
chooses to read, not a rule it must obey. An agent will not always open a skill
even when its trigger matches, and it is often right not to: the skills worth
writing are the ones that change the answer, not the ones that restate it.

## The index line is what gets it read

Jaeger parses nothing inside a skill. An agent chooses what to open from the
index and from nothing else, so the one line you write beside a link decides
whether that skill is ever read. That line has to be checkable before the skill
runs: an agent matches it against what it knows going in, the user's question
and what it has cheaply observed, not against what it will know afterwards.

- A line that says what the skill does, such as "analyses span timing
  distributions to classify sibling groups", describes no situation, so there is
  nothing to match against.
- A line that names the finding, such as "use when a trace shows many repeated
  near-identical child spans", is circular. The agent would have had to do the
  analysis to know the trigger applied.
- A line that names the situation, such as "use when a request is slow and the
  cause is not yet known, or when the user asks about repeated queries or chatty
  database access", is checkable. Both halves are known before any analysis.

Write the link relative to the skills root, not to the linking file's own
directory, because the agent passes the link text straight back to
`read_skill`. Your entry point is `<skills_dir>/SKILL.md` on disk, but an agent
asks for it as `custom/SKILL.md`, so a skill in
`<skills_dir>/slow-checkout-triage/` is linked as
`custom/slow-checkout-triage/SKILL.md`:

```markdown
- [slow-checkout-triage](custom/slow-checkout-triage/SKILL.md) — Triage a slow
  checkout by separating queue wait from service time. Use when a checkout
  request is slow and nothing in the trace errored.
```

## Anatomy of a skill

A skill is plain markdown, optionally opening with YAML front matter:

```markdown
---
name: slow-checkout-triage
description: >-
  Triage a slow checkout request by separating queue wait from service time.
  Use when a checkout or payment trace is slow but no span shows an error.
allowed-tools: get_trace_topology get_critical_path get_span_details
---

# Slow Checkout Triage

## When this applies
...

## Procedure
1. ...

## Gotchas
- ...
```

Jaeger reads no field of the front matter. It serves the file verbatim, so
`allowed-tools` documents which tools the procedure expects and is not a
sandbox. The front matter is still worth writing: both the
[agent skills specification](https://agentskills.io/specification) and the
[Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
use one, so a skill written for either stays readable here, and keeping
`description` identical to the index line means the two cannot drift.

The three body headings are a convention that earns its place. "When this
applies" lets an agent bail out of a skill it opened speculatively, "Procedure"
is the part it follows, and "Gotchas" is where the failure modes go.

Keep a skill about one situation. Progressive disclosure is the point: the
agent reads the index, then one skill, not the tree. Split a skill as soon as
it covers two situations a reader would arrive at separately, each with its own
entry and trigger line in the index. As a working target, keep a single skill
under roughly 500 lines.

## Write a procedure that decides

The failure mode is not a procedure that is wrong but one that cannot be
applied. Two readers following it must reach the same answer.

- Name the measurement, not the impression: "sum of durations versus elapsed
  window", not "similar durations".
- Say what to do with each outcome, including the negative one. A step that
  only describes the passing case leaves the agent to invent the rest.
- Order steps by what eliminates most: cheap disqualifying checks first,
  expensive per-span lookups last.
- End with what to report, naming the evidence. That is what stops a confident
  summary with nothing behind it.

The "Gotchas" section is where the value hides. It holds the cases in which the
obvious reading is wrong, and those cases are usually why the skill exists. For
example, a timed-out call often has nothing below it, because the work it was
waiting on never returned, so the skill should name the last visible span and
say the cause lies beneath it rather than blame the timeout. Every gotcha
should be something you have watched mislead someone: write the trap, then the
correct reading.

## Test it against a real trace

A skill you have only read is untested. Pick a trace on which the naive answer
and the correct answer differ, so the test can tell you whether the procedure
is pulling its weight, and derive the expected answer mechanically, from
measured timings or a deliberately injected fault, so the label is a fact about
the capture rather than a judgement you can quietly revise to match whatever
the skill happens to say.

## Checklist

- Linked from the index, relative to the skills root.
- The index line is checkable before the skill runs.
- `name` matches the directory, and the front matter `description` matches the
  index line.
- Every step names a measurement and says what to do with each outcome.
- The final step says what to report and what evidence to carry.
- Gotchas cover the cases where the obvious reading is wrong.
- Checked against at least one trace where the naive answer is wrong.
