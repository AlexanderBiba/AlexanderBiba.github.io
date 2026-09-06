A Wordle clone that grew into a full app. It started as the classic game, one five-letter word a day and six tries, with everything stored in the browser. I kept adding to it until it had accounts, stats, and a leaderboard.

What's in it:

- Daily Wordle with the usual rules
- Google sign-in so your profile follows you across devices
- Stats over time: games played, streaks, win rate, guess distribution
- Global leaderboards across several of those metrics
- Achievements with unlockable badges
- A live leaderboard backed by Firestore real-time updates
- Dark and light mode, remembered per user
- Installable as a PWA on mobile and desktop

It's a React 18 app with SCSS, deployed as a static site on GitHub Pages, with Firebase for auth and Firestore for data. Word validation and leaderboard aggregation run in Cloud Functions so the client isn't trusted with either. A lot of the later features were built with Cursor, which I wrote about in [My Experience with Cursor](/blog/cursor-experience/).

Source: [github.com/AlexanderBiba/wordle](https://github.com/AlexanderBiba/wordle)
