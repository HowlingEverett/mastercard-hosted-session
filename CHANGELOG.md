# Changelog

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