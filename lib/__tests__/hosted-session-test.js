const { describe, it } = require('mocha')
const assert = require('assert')

const paymentSessionFake = require('../../test/payment-session-fake')
const {
  getHostedSession,
  HostedSessionError,
  HostedSessionValidationError
} = require('../hosted-session')

describe('hosted-session wrapper module', () => {
  const hostedSessionInstance = async (
    initializedResponse = 'success',
    sessionizedResponse = 'success'
  ) => {
    return getHostedSession({
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
      },
      paymentSession: paymentSessionFake,
      forceInitialize: true
    })
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

  it('should resolve multiple sessions sequentially')
})
