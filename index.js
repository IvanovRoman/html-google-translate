const translate = require('google-translate-open-api').default
const { parseMultiple } = require('google-translate-open-api')

const { separate } = require('./lib/html-separate')
const { toHtml } = require('./lib/dom-utils')

async function translateHtml(html, options) {
  const { dom, sentences } = separate(html)

  const texts = sentences.map(sentence => sentence.text)

  const result = await translate(texts, options)

  const tarnsTexts = parseMultiple(result.data[0])

  for (let i = 0; i < sentences.length; i++) {
    sentences[i].update(tarnsTexts[i])
  }

  return toHtml(dom, options)
}

module.exports = translateHtml