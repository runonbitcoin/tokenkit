import webdriver from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

(async () => {
  const timeout = process.env.TIMEOUT || 10 * 60 * 1000
  const chromeOptions = new chrome.Options().headless()
  const driver = await new webdriver.Builder()
    .setChromeOptions(chromeOptions)
    .forBrowser('chrome')
    .build()

  const timeouts = await driver.manage().getTimeouts()
  timeouts.script = 90 * 1000
  await driver.manage().setTimeouts(timeouts)

  // Poll function to read logs
  async function poll () {
    let done = false

    try {
      done = (await driver.executeScript('return { done }')).done
    } catch (e) {
      console.warn('Error polling done:', e)
    }

    try {
      const logs = await driver.executeScript('return pollLogs()')
      for (const log of logs) console.log(...log)
    } catch (e) {
      console.warn('Error reading logs:', e)
    }

    return !done
  }
  
  let failures = 0

  try {
    const path = new URL('./browser.html?colors=1', import.meta.url).pathname
    await driver.get(`file://${ path }`)

    const startTime = new Date()
    const timedOut = () => (new Date() - startTime > timeout)
    while (!timedOut() && await poll());

    failures = await driver.executeScript('return failures')
  } finally {
    await driver.quit()
  }

  process.exit(failures)
})()