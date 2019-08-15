# Changelog

# 3.0

## Breaking Changes

Field validation failures on `sessionize` callbacks are no longer promise rejections. The reason
being, in some scenarios you want to use session data even if the session is not yet valid. For
example, you might want to fire a 3DS2 Pre-Auth setup flow once you have a valid PAN, but before
the user has a complete session with expiry and CCV fields valid.

Instead of catching `HostedSessionValidationError`, simply check the status field on the response,
as per Mastercard's Payment Session.

e.g.

```javascript
paymentSession.sessionize()
    .then((result) => {
        console.log(result.status) // e.g. 'fields_in_error'
        console.log(Object.keys(result.errors)) // e.g. 'cardNumber', 'securityCode' 
    })
```  

# 2.0

## Breaking Changes

It turns out Mastercard's CDN does not set `Access-Control-Allow-Origin` on responses to requests
for `session.js`. This means the dynamic script appending features of the library won't ever work.

2.0 removes this part, which slightly changes the signature of the global library function. This is
a breaking change, hence the major version.

```js
// Old signature
getHostedSession('MERCHANTID', config)

// New signature
getHostedSession(config)
```

In addition, it's now a pre-requisite to include a script tag for your Merchant ID's `session.js`
in your page, as you would when using `session.js` without the wrapping library.
 
# 1.0

Initial release