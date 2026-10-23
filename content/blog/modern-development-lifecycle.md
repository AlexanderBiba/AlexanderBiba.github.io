This is the process I'm using right now at the startup I work at to take a feature from a ticket to production, with Claude doing most of the writing and most of my own time going into the plan, before any code exists.

![](/content/967b9e2d44f35f1a46495c5932cc9f45ca066339-1600x960.png)

The whole thing from ticket to production. The dashed loops are the steps I go around more than once.

## The plan

It starts with a ticket, and I try to put as much information about the problem in it as I can, since everything after it builds on that.

Then I have Claude write a plan as an artifact, and I ask it to include mocks of everything. The mocks are what make the plan easy to review, you can see the user flows and understand them right away. Whatever comes back the first time is a starting point and nothing more.

So then I go back and forth on it until I understand it fully. One thing I do a lot here is ask Claude to make the plan more high level so it's easy to read, and I usually do that several times until it's really easy to consume. I add comments directly in the artifact and Claude updates the document inline in real time.

The plan should be clean and lean with as little slop as possible. It covers the big picture things like interfaces, database migrations and integrations, and it doesn't go into code detail, which doesn't matter at this point.

![](/content/350bef202d4fb20e014ed502712022ba4ebc346d-1600x1352.png)

The sections of my last plan, top to bottom. Code detail stays out until implementation.

As an example, the last plan I wrote was for a new integration. The top of it is the UI and flows, six flows you pick from tabs that play through the mocks with sample data, plus every new screen shown on its own. After that there's a diagram of how it fits into the rest of the system, a table of 8 decisions with the options for each and the default the plan assumes until we agree otherwise, then guardrails and phases, and at the end the integrations, the migrations (three new tables) and the interfaces.

By the time I'm done I need to know the plan in and out, I should be able to explain the whole thing and each section of it on my own.

## Reviewing the plan with someone

Once the plan is ready I review it with another team member, with me presenting and going through the document, and I add any comments they ask for. This step is crucial, it helps remove my own biases and gets feedback from other stakeholders before anything gets built. In the example plan the decisions table is literally titled "Decisions to make together", with the default highlighted in each row.

Implementation only starts after the plan is fully done and accepted by the reviewer.

## The PR

When implementation is done I open a PR, and then I add screen recordings, user flows and other high level documentation of the result. The idea is to document the behavior as much as possible, so it's easy to review, and if something goes wrong later it's easy to go back and see what was missing. Then I iterate on this part until the recordings and the behavior match the plan, or at least are satisfactory, and once all of that is in place the PR is ready for review.

## Review

I do the first round of review myself, working with an agent to find the highest leverage bugs, and I have it categorize them by priority and effort. High priority items with small to medium effort I usually just fix. Items with larger effort I need to review and understand first, the issue and its implications. Is it an architectural issue, does it affect other components, does it need its own separate piece of work, does it have to be done before this PR?

![](/content/82de209ea10ed518a8c8791885294d65f2a811ff-1600x940.png)

How I sort what the agent review finds before the PR goes to a teammate.

Once that agent assisted pass is done the PR goes to peer review. At this point it should be in good enough shape that the peer review produces minimal feedback, if any, and once the reviewer approves it's good to go to production.
