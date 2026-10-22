A Wordle clone with accounts, stats and a leaderboard.

It started as the classic game, one five-letter word a day and six tries, with everything saved in the browser. I kept adding stuff until it grew into a full app, and a lot of the later features I built with Cursor.

Word validation and leaderboard aggregation run in Cloud Functions, so the client can't fake either one.

What's in it:

- daily Wordle with the usual rules
- Google sign-in so your profile follows you across devices
- stats over time: games played, streaks, win rate and guess distribution
- global leaderboards for several of those stats
- achievements with badges you can unlock
- a live leaderboard backed by Firestore real-time updates
- dark and light mode, remembered per user
- installable as a PWA on mobile and desktop

It's built with React 18 and SCSS, with Firebase for auth and Firestore for data. It runs as a static site on GitHub Pages.

Related post: [I finally tried vibe coding](/blog/cursor-experience/)

Source: [github.com/AlexanderBiba/wordle](https://github.com/AlexanderBiba/wordle)
