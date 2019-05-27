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

## Supported Environments and Dependencies

Mastercard's `session.js` is a browser API that works via injected iframes. So
this facade will also only work in a browser. It's also a javascript module,
so you will need a module builder. I've tested this with `webpack`, but since
the distribution is transpiled you should be able to use it with your packer
of choice.

No matter what module environment you choose, your destination will need to
support *ES6 Promises*, since this facade relies on them heavily. Many browsers
already natively support Promises, but if a target browser you support does not
you'll need to include a polyfill.

## Installation

```bash
npm i mastercard-hosted-session --save-dev
```

## Usage

Import the library, and initialise the module with the merchant ID supplied
to you by Mastercard, and the config you'd normally pass to the
`PaymentSession.configure` method. **Do not** pass the `callbacks` methods
on your config object, since the facade configures those for you.

The initialisation function returns a Promise that will resolve a Hosted
Session facade, initialised against the form specified by the `config` fields.

The example below uses Promises directly, but since a Promise is a Promise you
can happily use the `async` function style if your environment or transpilation
tool support them. 

```javascript
const getHostedSession = require('mastercard-hosted-session')

getHostedSession('MYMERCHANTID', {
  fields: {
    card: {
      number: '#card-number',
      securityCode: '#security-code',
      expiryMonth: '#expiry-month',
      expiryYear: '#expiry-year'
    }
  },
  frameEmbeddingMitigation: ['csp'],
  interaction: {
    displayControl: {
      formatCard: 'EMBOSSED',
      invalidFieldCharacters: 'ALLOW'
    }
  }
}).then(hostedSession => {
  // hostedSession is a facade that has one public function: `sezzionize`
  return hostedSession.sessionize()
}).then((result) => {
  console.log(result.session.id) // e.g. SESSION001212312123123123
  console.log(result.sourceOfFunds.provided.card.brand) // e.g 'MASTERCARD'
}).catch(error => {
  // The facade rejects with HostedSessionError or HostedSessionValidationError
  // if the script fails to append, fails to sessionise, or fails validation.
  console.error(error)
})
```
