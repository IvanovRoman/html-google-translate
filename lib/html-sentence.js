const htmlparser2 = require('htmlparser2')

function toMap(tags) {
  const map = {}

  tags.forEach(tag => map[tag] = true)

  return map
}

const inlineTextTags = toMap([
  'a', 'abbr', 'acronym', 'b', 'basefont', 'bdo', 'big', 'cite', 'dfn', 'em', 'font',
  'i', 'input', 'nobr', 'label', 'q', 's', 'small', 'span', 'strike', 'strong', 'sub',
  'sup', 'textarea', 'tt', 'u', 'var'])

const inlineNoneTextTags = toMap([
  'br', 'code', 'img', 'kbd', 'map', 'object', 'param', 'script', 'style', 'wbr', 'svg'
])

const ignoredTags = toMap([
  'applet', 'area', 'base', 'frame', 'frameset', 'hr', 'link', 'meta', 'noframes',
  'noscript', 'input', 'textarea', 'title'
])

class Sentence {
  constructor(text, nodes) {
    this.text = text
    this.nodes = nodes
  }

  static createSentence(texts, nodes) {
    let text = ''

    if (texts.length === 1) {
      text = texts[0]
    } else {
      for (let i = 0; i < texts.length; i++) {
        text += `<a i=${i}>${texts[i]}</a>`
      }
    }

    return new Sentence(text, nodes)
  }
}

function mine(node, basket, baskets) {
  if (isTextNode(node)) {
    if (!isEmptyString(node.data)) {
      basket.texts.push(node.data)
      basket.nodes.push(node)
    }
  } else if (node.children && node.children.length) {
    mine(node.children[0], basket, baskets)
  }

  if (isLastInlineTextNode(node)) {
    if (!basket.done && basket.texts.length) {
      baskets.push(basket)
      basket.done = true
    }
  }

  if (node.next) {
    if (isFirstInlineTextNode(node.next)) {
      basket = { texts: [], nodes: [], done: false }
    }

    mine(node.next, basket, baskets)
  }
}

function separate(html) {
  const dom = getDom(html.trim())
  const baskets = []

  dom.forEach(node => mine(node, { texts: [], nodes: [], done: false }, baskets))

  return baskets.map(basket => Sentence.createSentence(basket.texts, basket.nodes))
}

function getDom(html) {
  const handler = new htmlparser2.DefaultHandler()
  new htmlparser2.Parser(handler).parseComplete(html)
  return handler.dom
}

function isEmptyString(str) {
  return !str.trim()
}

function isLastInlineTextNode(node) {
  return node.next ? !isInlineNode(node.next) :
    !node.parent || !isInlineNode(node.parent)
}

function isFirstInlineTextNode(node) {
  return (!isInlineNode(node.prev) && !isTextNode(node.prev)) ||
    (!isInlineNode(node) && !isTextNode(node))
}

function isTextNode(node) {
  return node.type === 'text'
}

function isInlineNode(node) {
  return isInlineTextNode(node) || isInlineNoneTextNode(node)
}

function isInlineTextNode(node) {
  return node.type === 'tag' && inlineTextTags[node.name]
}

function isInlineNoneTextNode(node) {
  return node.type === 'tag' && inlineNoneTextTags[node.name]
}

module.exports = {
  separate,
}