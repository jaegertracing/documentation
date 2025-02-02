---
title: Mentorship - For Mentees
---

## Application process

Applications are submitted via respective program websites, such as [Google Summer of Code][gsoc] and [LFX Mentorship][lfxm].

### Proposal

Jaeger mentorship projects are getting a lot of applications (up to 150 per project), therefore we require applicants to submit a proposal for the project, which allows us to find most suitable candidates. Even if a specific program's guidelines do not require submitting a proposal, please include it in the other application documents, such as a cover letter (PDF documents are preferred over hyperlinks).

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

It does not mean that the longer the proposal the better. It's about the quality and demonstrating which candidate better understands the problem and has a handle on how to solve it. You do not need to explain what Jaeger does and how. Instead, focus on the specific problem of the project, and think about the challenges and the solutions.

#### Level playing field

To ensure a fair and consistent evaluation process for all applicants, we cannot provide individual feedback on proposals before the submission deadline.  Providing feedback to some applicants and not others would create an unequal opportunity.  All proposals will receive thorough consideration by the selection committee after the deadline.  We encourage all interested individuals to submit their best work.

If you need to ask specific questions / clarifications about the project, please ask them in coimments on the tracking issue, where they will be visible to all applicants.

### Bootcamp

In order to understand the project better and come up with reasonable solutions, it's always helpful to become familiar with Jaeger and its code base. We strongly recommend going through the [Bootcamp](../get-involved/#bootcamp).

### Evaluation criteria

We do not have an exact checklist that we use for evaluation, but the following criteria have a high impact:

* Candidates have several PRs merged into Jaeger, which demonstrate:
  * their understanding of the code base,
  * their understanding of our development workflow,
  * their coding and problem solving skills.
* High quality proposal that demonstrates:
  * good understanding of the problem,
  * technical due diligence conducted,
  * viable approach to solving the problem.
* Evidence of previous high quality development tasks completed, e.g., in other open source projects.

## Mentorship

Congratulations on being selected as a Jaeger Mentee! It can be daunting when starting off on your project, so here are some guidelines to help you get started.

### Onboarding Checklist

- Please review the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md).
  It offers a guideline that both mentors and mentees should follow to ensure a
  safe environment for communication.
- Create an account on the [CNCF Slack](https://slack.cncf.io/) and
  personalize it with a photo/image to help you stand out.
- Send your mentors your slack account handle, so we can add you to private channels.
  We will create one with just you and your mentor, and second permanent private channel
  with all past and new mentees and mentors together.
- Join the [#jaeger](https://cloud-native.slack.com/archives/CGG7NFUJ3) public channel.
  This is where you can get help from the Jaeger community.
- Say “hello” to your mentors, fellow mentees, and jaeger community; and if
  you’re comfortable with it, introduce yourself with a few sentences.
- Read our contributing guides ([#1](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING.md),
  [#2](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING_GUIDELINES.md)),
  containing instructions on the development workflow.
- Familiarize yourself with the [Jaeger documentation](https://www.jaegertracing.io/docs/latest/),
  which provides an architecture overview of Jaeger, a comprehensive list of all
  CLI flags, among others.
- Carefully read through the Github issue to get a firm understanding of the requirements.
  Post any clarifying questions on that issue, ensuring a persistent record for
  later reference by yourself, mentors and the community.

### Keep a Progress Log

Since the mentorships are remote, the best way to ensure you are making steady progress and to keep your mentor informed is to keep a regular progress log.

- At the start of the term, copy this [Google doc template][template] and share it with your mentors (allow comments).
- At the start of each week, create a section for that week with a list of goals that you want to achieve.
- At the end of each day, add a dated log entry under the corresponding goal(s) with a brief summary of what you did.
  - This could be just one sentence, e.g. "Read the XYZ documentation {link}".
  - Ideally document some conclusions / decisions on how the work you did affects your future plans.
  - If you weren't able to work on a project on a given day, log that too, for transparency.

Why the log is important:
- The log gives your mentors visibility into your progress, and allows them to make course corrections.
- If you are unable to write your goals for a week, it's a sign of misunderstanding, and your mentors need to work with you to clarify the requirements and the approach.
- Many projects require research / analysis of how best to solve specific issues. Writing down your findings helps you organize your own understanding, and get timely feedback from the mentors. Remember that mentors may not be familiar with that specific area too, and they rely on you to research, synthesize, and present the information that affects the project.
- Clear writing is one of the most important skills for software engineers. You may think it's coding skills, but as you become more senior, writing is how you communicate your ideas and get alignment with the team / community. Use this mentorship to hone your writing skills.
- Treat the mentorship project as a job, with responsibility to make progress and meet the goals.

### Tips

- Ask questions! A good rule of thumb is if you spend more than an hour not able to find an answer
  in the documentation or the code, then don’t hesitate to ask your mentor for pointers. You can also ask in
  [#jaeger](https://cloud-native.slack.com/archives/CGG7NFUJ3) and #jaeger-mentorships Slack channels.
- Before embarking on a relatively substantial change, write up a plan on what you plan to do,
  why and potential challenges or unknowns. Consider documenting this as a
  [new issue](https://github.com/jaegertracing/jaeger/issues) in Jaeger.
- Work on small deliverables at a time, making small enhancements as you go along.
  Breaking down a large task into smaller pieces can help make a seemingly daunting task appear manageable.
  It also helps reduce cognitive load on reviewers! 😀
- It can be quite challenging to break down a problem, while dealing with the uncertainty of whether
  your approach will work in the end. A basic proof of concept provides assurance of the final outcome,
  can help highlight the sub-problems to tackle individually, while also giving you a chance
  to explore the various alternative solutions and identify the best option.
- You are welcome to join the [monthly Jaeger video calls](../get-in-touch/).
- Write unit tests and, if applicable, run live integration tests locally. Tests give assurance
  to yourself that what you’ve written works, documents the expected behavior to readers of the code,
  and prevents regressions from future contributions.
- You’re encouraged to review others’ PRs (e.g. from your fellow mentees)
  with kind and constructive feedback. It’s a great way to learn about good coding
  practices, while also helping familiarize yourself with the codebase.
- Feel free to suggest improvements! For example, if you’re experiencing a
  lot of friction in the development workflow, is there anything we can do to
  improve the developer experience through better documentation or automation?

[gsoc]: https://summerofcode.withgoogle.com/
[lfxm]: https://mentorship.lfx.linuxfoundation.org/
[template]: https://docs.google.com/document/d/1lAL0iHHozXZoIL4W0qiOWyXVPo9a6lUTeH9cz95O6Kg/edit#
