const { describe, it } = require('mocha')
const assert = require('assert')

const paymentSessionFake = require('../../test/payment-session-fake')
const {
  HostedSession,
  HostedSessionError,
  HostedSessionValidationError
} = require('../hosted-session')

describe('hosted-session wrapper module', () => {
  const hostedSessionInstance = async (
    initializedResponse = 'success',
    sessionizedResponse = 'success'
  ) => {
    return new HostedSession(
      paymentSessionFake,
      {
        merchantId: 'TESTMERCHANTID',
        config: {
          fields: {
            card: {
              number: '#card-number',
              securityCode: '#security-code',
              expiryMonth: '#expiry-month',
              expiryYear: '#expiry-year'
            }
          },
          frameEmbeddingMitigation: ['csp'],
          initializedResponse, // Fake-specific config
          sessionizedResponse // Fake-specific config
        }
      }
    ).initialize()
  }

  it('should resolve a valid session on #sessionize', async () => {
    const hostedSession = await hostedSessionInstance()
    const result = await hostedSession.sessionize()

    assert(result.status === 'ok')
    assert(result.session.updateStatus === 'SUCCESS')
    assert(result.sourceOfFunds.provided.card.brand === 'MASTERCARD')
  })

  it('should reject if fields are invalid in the iframe', async () => {
    const hostedSession = await hostedSessionInstance(
      'success',
      'fields_in_error'
    )
    try {
      await hostedSession.sessionize()
    } catch (error) {
      assert(error instanceof HostedSessionValidationError)
      assert.deepStrictEqual(
        Object.keys(error.fieldErrors),
        ['cardNumber', 'securityCode']
      )
    }
  })

  it('should reject if the script fails', async () => {
    const hostedSession = await hostedSessionInstance('success',
      'system_error')

    try {
      await hostedSession.sessionize()
    } catch (error) {
      assert(error instanceof HostedSessionError)
    }
  })

  it('should reject on #initialiaze if the script fails', async () => {
    try {
      await hostedSessionInstance('request_timeout')
    } catch (error) {
      assert(error instanceof HostedSessionError)
      assert(error.code === 'request_timeout')
    }
  })

  it('should resolve multiple sessions sequentially', async () => {
    const hostedSession = await hostedSessionInstance()

    // First request, long delay, if non-sequential would resolve last
    paymentSessionFake.delay = 400
    const a = hostedSession.sessionize()
      .then(() => {
        return new Date()
      })

    // If non-sequential, this would resolve second
    paymentSessionFake.delay = 200
    const b = hostedSession.sessionize()
      .then(() => {
        return new Date()
      })

    // If non-sequential, this would resolve first
    paymentSessionFake.delay = 100
    const c = hostedSession.sessionize()
      .then(() => {
        return new Date()
      })

    return Promise.all([a, b, c]).then(([aDate, bDate, cDate]) => {
      assert(aDate < bDate) // A resolves first, even though it has a long delay
      assert(aDate < cDate)
      assert(bDate < cDate) // B resolves before C
    })
  })
})
