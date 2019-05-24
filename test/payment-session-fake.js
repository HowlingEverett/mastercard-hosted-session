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
  success: {
    status: 'ok',
    merchant: 'TESTMERCHANT',
    session: {
      id: 'SESSION000218450948092491657986',
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
  },
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

class PaymentSessionFake {
  constructor () {
    this.config = null
    this.initializedCallback = () => {}
    this.formSessionUpdateCallback = () => {}
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
    Promise.resolve().then(() => {
      const responseType = this.config.sessionizedResponse
      const response = CALLBACK_RESPONSES[responseType] ||
        CALLBACK_RESPONSES['success']
      this.formSessionUpdateCallback(response)
    })
  }
}

module.exports = new PaymentSessionFake()
