const INITIALIZED_RESPONSES = {
  success: {
    status: 'ok'
  },
  system_error: {
    status: 'system_error',
    message: 'System error message'
  },
  request_timeout: {
    status: 'request_timeout',
    message: 'Request Timeout error message'
  }
}

const CALLBACK_RESPONSES = {
  fields_in_error: {
    status: 'fields_in_error',
    session: {
      id: 'SESSION000218450948092491657986'
    },
    errors: {
      cardNumber: 'invalid',
      securityCode: 'invalid'
    },
    version: '52'
  },
  system_error: {
    status: 'system_error',
    session: {
      id: 'SESSION000218450948092491657986'
    },
    errors: {
      message: 'System error message.'
    },
    version: '52'
  },
  request_timeout: {
    status: 'request_timeout',
    session: {
      id: 'SESSION000218450948092491657986'
    },
    errors: {
      message: 'Request Timeout error message.'
    },
    version: '52'
  }
}

const DEFAULT_SESSION_ID = 'SESSION000218450948092491657986'
const sessionWithId = (sessionId) => {
  return {
    status: 'ok',
    merchant: 'TESTMERCHANTID',
    session: {
      id: sessionId || DEFAULT_SESSION_ID,
      updateStatus: 'SUCCESS',
      version: 'e3f144ce02'
    },
    sourceOfFunds: {
      provided: {
        card: {
          brand: 'MASTERCARD',
          expiry: {
            month: '5',
            year: '21'
          },
          fundingMethod: 'DEBIT',
          nameOnCard: 'John Smith',
          number: '512345xxxxxx8769',
          scheme: 'MASTERCARD'
        }
      },
      type: 'CARD'
    },
    version: '52'
  }
}

class PaymentSessionFake {
  constructor () {
    this.config = null
    this.initializedCallback = () => {}
    this.formSessionUpdateCallback = () => {}
    this.delay = 0
  }

  configure (config) {
    this.config = config
    this.initializedCallback = config.callbacks.initialized ||
      this.initializedCallback
    this.formSessionUpdateCallback = config.callbacks.formSessionUpdate ||
      this.formSessionUpdateCallback

    Promise.resolve().then(() => {
      const responseType = this.config.initializedResponse
      const response = INITIALIZED_RESPONSES[responseType] ||
        INITIALIZED_RESPONSES['success']
      this.initializedCallback(response)
    })
  }

  updateSessionFromForm () {
    // Poor man's process.nextTick
    Promise.resolve()
      .then(() => {
        return new Promise(resolve => setTimeout(resolve, this.delay))
      })
      .then(() => {
        const responseType = this.config.sessionizedResponse || 'success'
        const response = responseType === 'success'
          ? sessionWithId()
          : CALLBACK_RESPONSES[responseType]
        this.formSessionUpdateCallback(response)
      })
  }

  onChange () {

  }

  onFocus () {

  }

  onBlur () {

  }

  onMouseOver () {

  }

  onMouseOut () {

  }
}

module.exports = PaymentSessionFake
