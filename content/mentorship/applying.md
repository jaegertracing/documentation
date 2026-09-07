---
title: Mentorship Application Guidelines
linkTitle: Applying
aliases: [/mentorship-for-mentees]
---

## Application process

Applications are submitted via respective program websites, such as [Google Summer of Code][gsoc] and [LFX Mentorship][lfxm].

### Proposal

Jaeger mentorship projects are getting a lot of applications (up to 150 per project); therefore, we require applicants to submit a **proposal** for the project, which allows us to identify the most suitable candidates. The LFX Mentorship and GSoC applications support uploading the proposal document directly. Even if a specific program's guidelines do not require submitting a proposal, please include it in the other application documents, such as a **cover letter**. Do not provide a link to another location like a Google Doc; the submitted proposal must be directly attached to the application as an immutable document (PDFs are preferred).

We are looking for the following topics to be covered by the proposal:

* About you
  * Why are you interested in this specific project?
  * What kind of relevant experience or skills do you have that will help you be successful?
  * (optional) What kind of open source experience you have? Please link to some notable pull requests.
  * What are your time commitments during the mentorship term?
* About the project
  * How do you understand what needs to be done in this project?
  * What kind of technical challenges do you foresee and how do you suggest to address them?
  * How do you plan to approach the project (roadmap, milestones, schedule)?

The project description may request additional material, such as a small experiment, an analysis of competing approaches, or examples of a proposed design. Follow those project-specific instructions in addition to these general guidelines.

A strong proposal should:

* Demonstrate technical due diligence. Read the linked issues, RFCs, ADRs, relevant code, and active pull requests. When practical, run the software or perform a small experiment and report what you observed.
* Present your own technical approach. Make concrete choices, explain your reasoning and the trade-offs, and state what evidence might cause you to reconsider. A reasoned choice that mentors later refine is more useful than a list of options with no recommendation.
* Be specific to the project. Identify relevant components or areas of the codebase, work already in progress, dependencies between tasks, and existing code or behavior that your work would change or remove.
* Explain how you will demonstrate success. Describe concrete testing, validation, compatibility, performance, or measurement criteria relevant to the project instead of saying only that the implementation will be thoroughly tested.
* Provide a realistic timeline. Include an initial research and setup phase, ordered and demonstrable milestones, time for testing and documentation, key risks, and fallback or scope-reduction options.
* Account for collaboration. Explain how your plan relates to open issues and pull requests, and allow time to review and coordinate with other contributors.
* Support claims about your experience with links to representative code, pull requests, designs, or other work, and briefly describe your contribution.
* Verify every technical claim, citation, link, and description of the existing code. Do not invent details to make the proposal appear more specific.

Longer proposals are not necessarily better. Your proposal should add analysis beyond what is already in the project description. Repeating the requirements, listing technologies, or providing generic implementation phases does not demonstrate understanding. We value concrete evidence, sound reasoning, and an honest discussion of uncertainty more than length, polish, or agreement with a particular solution. You do not need to explain what Jaeger does. Focus on the project's specific problems, challenges, and possible solutions.

#### Level playing field

To ensure a fair and consistent evaluation process for all applicants, we cannot provide individual feedback on proposals before the submission deadline. Providing feedback to some applicants and not others would create an unequal opportunity. All proposals will receive thorough consideration by the selection committee after the deadline. We encourage all interested individuals to submit their best work.

If you need to ask specific questions / clarifications about the project, please ask them in the comments on the tracking issue, where they will be visible to all applicants.

### Bootcamp

In order to understand the project better and come up with reasonable solutions, it's always helpful to become familiar with Jaeger and its codebase. We strongly recommend going through the [Bootcamp](../../get-involved/#bootcamp).

### Evaluation criteria

We do not have an exact checklist that we use for evaluation, but the following criteria have a high impact:

* Candidates have several PRs merged into Jaeger, which demonstrate:
  * their understanding of the codebase,
  * their understanding of our development workflow,
  * their coding and problem solving skills.
* High quality proposal that demonstrates:
  * good understanding of the problem,
  * technical due diligence conducted,
  * viable approach to solving the problem.
* Evidence of previous high quality development tasks completed, e.g., in other open source projects.

### Selection Decisions and Post-Selection Inquiries

Given the high volume of applications (often exceeding 100 per project), the selection process is highly competitive. The maintainers evaluate candidates holistically, balancing both community contributions (PRs) and the technical depth and research demonstrated in the written proposal.

If you are not selected, please keep the following guidelines in mind:

*   **Decisions are final:** Once the chosen mentees are announced for a term, the selection is final.
*   **No candidate comparisons:** To respect the privacy of all applicants and maintain a supportive community environment, maintainers will not discuss, debate, or compare candidates against one another under any circumstances. Public or private harassment regarding selection decisions violates the CNCF Code of Conduct.
*   **Limited feedback:** While we deeply appreciate the hard work and enthusiasm of all applicants, the sheer volume of submissions means we generally cannot provide individualized, post-selection feedback on why a specific application was not chosen.

Not being selected is rarely a reflection of your coding abilities; it is simply a reality of the limited mentorship slots available. We highly encourage you to remain active in the Jaeger community and apply again in future cohorts.

[gsoc]: https://summerofcode.withgoogle.com/
[lfxm]: https://mentorship.lfx.linuxfoundation.org/
