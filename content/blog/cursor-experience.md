I've used autocomplete for as long as I've been writing code, so when GitHub Copilot came out with suggestions that actually understood the rest of the file I was interested. But I was late to the whole "vibe coding" thing. When work gave us Cursor licenses I mostly ignored mine, I felt faster doing things my way and I wasn't going to risk a deadline on a tool I didn't trust yet.

Then I went on paternity leave, and with some free time and no deadlines I decided to actually learn how to work with an AI agent instead of just hitting tab. It went better than I expected. I tried it on three of my projects.

## My personal website (React, GitHub Pages)

I started with my [personal website](https://alexanderbiba.github.io/), a small React app on GitHub Pages. The first prompt is what got me hooked:

> "This is my personal website; it looks a bit dated. Can we make it look modern and cool? Specifically, I would like a retro-futuristic theme and a dark mode/light mode button."

![](/content/28616e6f80414bcac499e8e07a043c5b606b4d48-2382x1620.png)

The result was ok, a bit cartoonish, and it turns out retro-futuristic isn't really my thing. So I tried again:

> "Actually, make it more professional, minimalistic, and concise, while still surfacing the most relevant information."

and kept nudging it with stuff like "this section is unnecessary" and "let's try a dark style". A few rounds later I had something I liked. The best part was how fun it was, trying a style, throwing it away and trying another one used to take so long that I'd never bother.

|         Before         |         After         |
| :--------------------: | :-------------------: |
| ![](/content/8ff76a795b4dc307e4a15b03b0c23565e12b6a38-2048x1253.png) | ![](/content/a5fced46f7a8fdd4083e3fafe901368530577222-2048x1444.png) |

## Wordle clone (React, Firebase)

Next was my [Wordle clone](https://alexanderbiba.github.io/wordle/), a React and Firebase app. The original was pretty bare, one word a day, five guesses, everything saved in browser storage. With the agent I added Google sign-in, stats (games played, streak, win rate and guess distribution), a leaderboard and an info page. It even walked me through which Firebase settings to change for the new login flow, which I didn't expect.

|         Before         |         After         |
| :--------------------: | :-------------------: |
| ![](/content/851987bcf98eb2b1452f1d3e566b07fbb6387187-1172x1618.png) | ![](/content/bc7035e499014c684a04bad9e825eaed39a6b546-1202x2048.png) |

But this is also where I started running into problems:

- Dark mode worked until I zoomed out, and then white bars showed up where the dark background should be.
- Redesigning the keyboard took a bunch of tries. First it ended up outside the card, then I had two keyboards.
- The guess distribution always showed five guesses no matter how I'd actually played.
- Moving state to Firebase so it syncs across devices made everything really slow, so I reverted that and now it only writes on submit or refresh.
- Every new card, modal or tab came out with slightly different shadows, padding or margins.

Everything got there eventually, but each feature took a few rounds of back and forth.

## ESP32 Wi-Fi clock (C++, PlatformIO)

The last one was my [ESP32 dot matrix Wi-Fi clock](https://github.com/AlexanderBiba/esp32-dotmatrix-wifi-clock), C++ on PlatformIO driving a dot matrix display, with a settings page in plain HTML and JS.

![](/content/11488dff0caf77a5a3f5f03d18fbc5446ea56061-2268x1275.jpg)

This one was a lot harder. Most changes broke something and I had to debug it myself. Web page changes stopped matching the server config, edits to the boot sequence stopped the device from turning on at all, and changes to the settings struct wiped the saved data. Still, I got a lot done: light and dark modes for the web page, new screens like a countdown and a Matrix style rain effect, options for screen order and orientation, and mDNS, timezone and weather from the Open-Meteo API, plus reboot and factory reset.

|        Before         |        After         |
| :-------------------: | :------------------: |
| ![](/content/b93ba9ac88a7b47be7364fbd36177b7d57ff031f-907x897.png) | ![](/content/f814dab0cbe973f2eaa73f236b50adbb5bdf51a7-1223x2048.png) |

## What I learned

It's best at starting from zero, bootstrapping a new project or feature is where it's most impressive. It's also good at small, well-defined changes if you point it at the right file, and at cleaning up dead code and unused dependencies. Where it struggles is consistency, it keeps reinventing patterns unless you tell it exactly which ones to follow, and big features need a very specific prompt, usually more than one. The code it writes can also be brittle and fit only the exact thing you asked for.

A few things that helped me:

- Start a fresh chat often, long threads drift.
- When it goes sideways, revert and rephrase instead of patching the patch.
- Name the files and entry points, and be very specific. Vague prompts get vague code.
- Put your project's conventions in `.cursor/rules` so you don't have to repeat them.
- Have fun with it, getting good at this takes some playing around.
