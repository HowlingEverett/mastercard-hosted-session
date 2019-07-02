export default (merchantId) => {
  const scriptSrc = `https://ap-gateway.mastercard.com/form/version/52/merchant/${merchantId}/session.js`
  let retries = 0
  const maxRetries = 5
  const timeoutTimer = 30 * 1000

  const appendScript = () => {
    return new Promise((resolve, reject) => {
      const timeout = Date.now() + timeoutTimer
      const handleTimeout = setTimeout(() => {
        return reject(new Error(`Failed appending script: ${scriptSrc}`))
      }, timeoutTimer)

      const id = `__mastercard_hosted_session`
      const elem = document.getElementById(id)
      if (elem) {
        elem.parentElement.removeChild(elem)
      }

      const script = document.createElement('script')
      script.id = id
      script.type = 'text/javascript'
      script.async = true
      script.crossOrigin = 'anonymous'

      script.onerror = (error) => {
        if (++retries > maxRetries || Date.now() >= timeout) {
          clearTimeout(handleTimeout)
          return reject(error)
        }
        return appendScript()
      }

      script.onload = script.onreadystatechange = () => {
        clearTimeout(handleTimeout)
        return resolve()
      }

      script.src = scriptSrc
      document.body.appendChild(script)
    })
  }

  return appendScript()
}
