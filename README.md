# Mastercard Hosted Session Facade

You're probably here because you went to implement the Mastercard (TNS)
`session.js` API in your app and encountered the...odd...design of their API.
"Why," you ask, "would they think a callback registered on a config object
being called by a completely unrelated global method is a good idea? Surely
there's a better way?"

Perhaps you wish that you could ask for a card session, and get a Promise back
that might resolve to a valid session, or reject on an invalid session.

Ssh. It's ok. Just use this facade. Don't fret. Don't look into the lib folder,
because this is an ugly, ugly hack. But it works reliably. And you can keep
writing your modern javascript code without twisting your brain around a
tortured API.

## Supported Environments

Mastercard's `session.js` is a browser API that works via injected iframes. So
this facade will also only work in a browser. It's also a javascript module,
so you will need a module builder. I've tested this with `webpack`, but since
the distribution is transpiled you should be able to use it with your packer
of choice.

## Installation

```bash
npm i mastercard-hosted-session --save-dev
```

## Usage

Import the library, and initialise the module with 