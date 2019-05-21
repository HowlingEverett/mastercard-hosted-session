const latest = require('promise-latest')

const getScript = require('./get-script')

/**
 *
 * @param merchantId
 * @param fields
 * @param frameEmbeddingMitigation
 * @param interaction
 * @param wallets
 * @param order
 * @param scope
 *
 * @return Promise that will resolve to an initialised Hosted Session, or reject
 * if the session cannot be initialised.
 */
module.exports = ({
  merchantId,
  ...config
}) => {
  return getScript(merchantId)
    .then((paymentSession = global.PaymentSession) => {
      return configureSession(paymentSession, config)
    })
}

const configureSession = (paymentSession, config) => {
  return new HostedSession(paymentSession, config).initialize()
}

class HostedSession {
  constructor (paymentSession, config) {
    this.paymentSession = paymentSession
    this.config = config
  }

  initialize () {
    return new Promise((resolve, reject) => {
      this.paymentSession.configure({
        ...this.config,
        callbacks: {
          initialized: (result) => {
            if (result.status === 'ok') {
              return resolve(this)
            } else {
              return reject(
                new HostedSessionError(result.message, result.status)
              )
            }
          },
          formSessionUpdate: this._sessionUpdated
        }
      })
    })
  }

  sessionize () {
    return latest(this._sessionize)
  }

  _sessionize () {
    return new Promise((resolve, reject) => {
      this._clearSessionResult()

      this.paymentSession.updateSessionFromForm(this.config.scope || 'card')

      const intervalId = setInterval(() => {
        const result = this.sessionResultStack.pop()
        clearInterval(intervalId)

        if (result.status === 'ok') {
          return resolve(result)
        } else if (result.status === 'fields_in_error') {
          return reject(new HostedSessionValidationError(result.errors))
        }
      }, 10)
    })
  }

  _sessionUpdated (result) {
    this.sessionResultStack.push(result)
  }

  _clearSessionResult () {
    this.sessionResultStack = []
  }
}

class HostedSessionError extends Error {
  constructor (message, code) {
    super()

    this.message = message
    this.stack = (new Error(message)).stack
    this.code = code
  }
}

class HostedSessionValidationError extends Error {
  constructor (fieldErrors) {
    super()

    this.message = `Invalid fields in form: ${fieldErrors.keys().join(', ')}`
    this.stack = (new Error(message)).stack
    this.fieldErrors = fieldErrors
  }
}
