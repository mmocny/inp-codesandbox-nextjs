# INP React (NextJS) Demo: Sail boat Search!

A interactive demo and workshop for learning about [Interaction to Next Paint (INP)](https://web.dev/inp), using React and NextJS.

If you like following a long in a video form, here's a session from Google I/O 2023 -> https://www.youtube.com/watch?v=KZ1kxzsJZ5g.

## Getting Started

Clone this repository, or, [open it in a cloud editor such as CloudSandbox](https://codesandbox.io/p/github/mmocny/inp-codesandbox-nextjs)).

If you cloned the repo, install the dependencies `npm install`, and run it with `npm run dev` or follow the [NextJS development guide](https://nextjs.org/docs/getting-started/installation#run-the-development-server).

Make edits in `app/page.tsx`, and follow the instructions in this Readme.

## 0: Try the default application

After cloning the repo, try the default application.  The search box works, and is fairly responsive -- but the search results are *not actually working*.

You can check the DevTools console for live Interaction measurements.

## 1: Implement simple Search functionality

To add search, update the `filterResults` function to actually assign a score to each possible search result.
You can do so just by uncommenting a single line in this workshop.

Notice, that search works much better now -- but the page is very slow to respond to search input.
With each subsequent character, it gets even slower!

## 2: Delay search results until after textbox updates

As an initial improvement, lets delay starting to compute search results until at least the search textbox updates.
There are many ways to do this, but the cleanest way in modern react is to leverage the `useTransition` hook.

A transition is a way to make a state change-- but to let React delay rendering that part of the Component update until after the initial render.

ANSWER

If you type one character at a time, slowly, you will see a small improvement: at least you can see what you are typing!  Results are still slow, and rapid text entry is still a problem.

## 3. Delay search results even more: Debounce

Move the `startTransition` and state update to a `debounce` effect.  Meaning, delay the transition after the event changes the state of the search term, for 500-1000ms.

The debounced effect will cancel any work that hasn't started yet, in case the user types quickly.

This helps for many interactions, perhaps most interactions, but still -- once the work to generate search results does get started-- an interaction at that exact moment will still be slow.

Also, debounce means intentionally delaying search results.  Although the responsiveness of the textbox is much better-- the response of the search results is much worse.

Not great.

## 4. Async search filter that yields

Lets change our `filterResults` to be async, and to yield to the browser main thread as it processes through search results.

Instead of generating all the results all in one go, synchronously, it will resolve a Promise when it is done, asynchronously.

Now, each new import can be handled by the browser, and by react, and it will replace out search term and overwrite our Transition.

## 5. Remove the debounce

Now that we have yieldy `filterResults`, we don't really need to debounce any more.  We may still choose to do so -- for example, if filterResults needed to make a fetch call to a server, which could be expensive to do needlessly.

## 6. One last improvement: Abortable Transitions

The previous version is *always* responsive, however, with each new character typed, we will generate the full search results -- even if we already aborted the transition and won't need them any more.

Let's leverage an `AbortController` to cancel any in-progress work, whenever the search term changes.
