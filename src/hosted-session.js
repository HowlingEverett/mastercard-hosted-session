import uuid from 'uuid/v4'

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
          formSessionUpdate: (result) => {
            this._sessionUpdated(result)
          }
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
          this.activeRequest = this.sessionizeCalls.shift()
          this.paymentSession.updateSessionFromForm(this.config.scope || 'card')
        }
        // 2. Wait our turn to process
        if (this.activeRequest !== requestId) { return }
        // 3. Wait until we have a result on our turn
        if (this.sessionResultStack.length === 0) { return }

        clearInterval(intervalId)
        this.activeRequest = null

        const result = this.sessionResultStack.pop()
        if (result.status === 'ok') {
          return resolve(result)
        } else if (result.status === 'fields_in_error') {
          return reject(new HostedSessionValidationError(result.errors))
        } else {
          return reject(new HostedSessionError(result.errors.message,
            result.status))
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

    this.message = `Invalid fields in form: ${Object.keys(fieldErrors).join(', ')}`
    this.stack = (new Error(this.message)).stack
    this.fieldErrors = fieldErrors
  }
}

export {
  HostedSession,
  HostedSessionError,
  HostedSessionValidationError
}
