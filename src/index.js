import getScript from './get-script'
import { HostedSession } from './hosted-session'

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
const getHostedSession = ({
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

export default getHostedSession
