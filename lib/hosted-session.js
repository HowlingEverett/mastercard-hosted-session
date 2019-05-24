const uuid = require('uuid/v4')

const getScript = require('./get-script')

/**
 * Resolves a configured and initialised Hosted Session wrapper. You can use
 * this wrapper object to get reliably-ordered multiple calls to the
 * sessionisation API.
 * @param merchantId Your Mastercard-provided merchant ID
 * @param config all PaymentSession config options *other* than callbacks
 * @param [paymentSession] optional injection of the PaymentSession global
 *
 * @return Promise that will resolve to an initialised Hosted Session, or reject
 * if the session cannot be initialised.
 */
module.exports = ({
  merchantId,
  config,
  paymentSession = global.PaymentSession
}) => {
  return getScript(merchantId)
    .then(() => {
      return configureSession(paymentSession, config)
    })
}

let sessionInstance

/**
 * Singleton accessor for Hosted Session. Initialises the session against a
 * payment form, or returns the already initialised form wrapper.
 * @param paymentSession PaymentSession instance from the mastercard API
 * @param config all PaymentSession config options *other* than callbacks
 * @returns {Promise<HostedSession>}
 */
const configureSession = (paymentSession, config) => {
  if (sessionInstance) {
    return Promise.resolve(sessionInstance)
  }
  sessionInstance = new HostedSession(paymentSession, config)
  return sessionInstance.initialize()
}

class HostedSession {
  constructor (paymentSession, config) {
    this.paymentSession = paymentSession
    this.config = config
    this.sessionizeCalls = []
    this.sessionResultStack = []
    this.activeRequest = null
  }

  /**
   * Initialises a new PaymentSession instance against a form in your page.
   * See Mastercard's session.js API docs for how the configuration options
   * work.
   * @returns {Promise<HostedSession>}
   */
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

  /**
   * Executes a sessionization flow. Roughly equivalent to executing
   * PaymentSession.updateSessionFromForm, except that you get a promise
   * that will resolve to the result (or reject with failures). You can call
   * this method as many times as you like and guarantee you'll get the
   * results for your particular call.
   * @returns {Promise<any>}
   */
  sessionize () {
    const requestId = uuid()
    this.sessionizeCalls.push(requestId)
    return this._sessionize(requestId)
  }

  _sessionize (requestId) {
    return new Promise((resolve, reject) => {
      // Ugly hack: each promise polls for its turn, executes PaymentSession
      // and then waits for a result to resolve or reject on it.
      // Ugly. But it works!
      const intervalId = setInterval(() => {
        // 1. Queue up an active request if there is none right now
        if (!this.activeRequest) {
          this.activeRequest = this.sessionizeCalls.pop()
          this.paymentSession.updateSessionFromForm(this.config.scope || 'card')
        }
        // 2. Wait our turn to process
        if (this.activeRequest !== requestId) { return }
        // 3. Wait until we have a result on our turn
        if (this.sessionResultStack.length === 0) { return }

        clearInterval(intervalId)

        const result = this.sessionResultStack.pop()
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
    this.stack = (new Error(this.message)).stack
    this.fieldErrors = fieldErrors
  }
}
