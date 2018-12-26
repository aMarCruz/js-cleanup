/* Riot WIP, @license MIT, (c) 2015 Muut Inc. + contributors */
;(function(window, undefined) {
  'use strict';
var riot = { version: 'WIP', settings: {} },
  __uid = 0,
  __virtualDom = [],
  __tagImpl = {},
  RIOT_PREFIX = 'riot-',
  RIOT_TAG = RIOT_PREFIX + 'tag',
  T_STRING = 'string',
  T_OBJECT = 'object',
  T_UNDEF  = 'undefined',
  T_FUNCTION = 'function',
  SPECIAL_TAGS_REGEX = /^(?:opt(ion|group)|tbody|col|t[rhd])$/,
  RESERVED_WORDS_BLACKLIST = ['_item', '_id', '_parent', 'update', 'root', 'mount', 'unmount', 'mixin', 'isMounted', 'isLoop', 'tags', 'parent', 'opts', 'trigger', 'on', 'off', 'one'],
  IE_VERSION = (window && window.document || {}).documentMode | 0
/* istanbul ignore next */
riot.observable = function(el) {
  el = el || {}
  var callbacks = {},
    onEachEvent = function(e, fn) { e.replace(/\S+/g, fn) },
    defineProperty = function (key, value) {
      Object.defineProperty(el, key, {
        value: value,
        enumerable: false,
        writable: false,
        configurable: false
      })
    }
  defineProperty('on', function(events, fn) {
    if (typeof fn != 'function')  return el
    onEachEvent(events, function(name, pos) {
      (callbacks[name] = callbacks[name] || []).push(fn)
      fn.typed = pos > 0
    })
    return el
  })
  defineProperty('off', function(events, fn) {
    if (events == '*') callbacks = {}
    else {
      onEachEvent(events, function(name) {
        if (fn) {
          var arr = callbacks[name]
          for (var i = 0, cb; cb = arr && arr[i]; ++i) {
            if (cb == fn) arr.splice(i--, 1)
          }
        } else delete callbacks[name]
      })
    }
    return el
  })
  defineProperty('one', function(events, fn) {
    function on() {
      el.off(events, on)
      fn.apply(el, arguments)
    }
    return el.on(events, on)
  })
  defineProperty('trigger', function(events) {
    var arglen = arguments.length - 1,
      args = new Array(arglen)
    for (var i = 0; i < arglen; i++) {
      args[i] = arguments[i + 1]
    }
    onEachEvent(events, function(name) {
      var fns = (callbacks[name] || []).slice(0)
      for (var i = 0, fn; fn = fns[i]; ++i) {
        if (fn.busy) return
        fn.busy = 1
        try {
          fn.apply(el, fn.typed ? [name].concat(args) : args)
        } catch (e) { el.trigger('error', e) }
        if (fns[i] !== fn) { i-- }
        fn.busy = 0
      }
      if (callbacks.all && name != 'all')
        el.trigger.apply(el, ['all', name].concat(args))
    })
    return el
  })
  return el
}
/* istanbul ignore next */
;(function(riot) { if (!window) return;
var RE_ORIGIN = /^.+?\/+[^\/]+/,
  EVENT_LISTENER = 'EventListener',
  REMOVE_EVENT_LISTENER = 'remove' + EVENT_LISTENER,
  ADD_EVENT_LISTENER = 'add' + EVENT_LISTENER,
  HAS_ATTRIBUTE = 'hasAttribute',
  REPLACE = 'replace',
  POPSTATE = 'popstate',
  TRIGGER = 'trigger',
  MAX_EMIT_STACK_LEVEL = 3,
  win = window,
  doc = document,
  loc = win.history.location || win.location,
  prot = Router.prototype,
  clickEvent = doc && doc.ontouchstart ? 'touchstart' : 'click',
  started = false,
  central = riot.observable(),
  routeFound = false,
  base, current, parser, secondParser, emitStack = [], emitStackLevel = 0
function DEFAULT_PARSER(path) {
  return path.split(/[/?#]/)
}
function DEFAULT_SECOND_PARSER(path, filter) {
  var re = new RegExp('^' + filter[REPLACE](/\*/g, '([^/?#]+?)')[REPLACE](/\.\./, '.*') + '$'),
    args = path.match(re)
  if (args) return args.slice(1)
}
function Router() {
  this.$ = []
  riot.observable(this)
  central.on('stop', this.s.bind(this))
  central.on('emit', this.e.bind(this))
}
function normalize(path) {
  return path[REPLACE](/^\/|\/$/, '')
}
function isString(str) {
  return typeof str == 'string'
}
function getPathFromRoot(href) {
  return (href || loc.href)[REPLACE](RE_ORIGIN, '')
}
function getPathFromBase(href) {
  return base[0] == '#'
    ? (href || loc.href).split(base)[1] || ''
    : getPathFromRoot(href)[REPLACE](base, '')
}
function emit(force) {
  var isRoot = emitStackLevel == 0
  if (MAX_EMIT_STACK_LEVEL <= emitStackLevel) return
  emitStackLevel++
  emitStack.push(function() {
    var path = getPathFromBase()
    if (force || path != current) {
      central[TRIGGER]('emit', path)
      current = path
    }
  })
  if (isRoot) {
    while (emitStack.length) {
      emitStack[0]()
      emitStack.shift()
    }
    emitStackLevel = 0
  }
}
function click(e) {
  if (
    e.which != 1
    || e.metaKey || e.ctrlKey || e.shiftKey
    || e.defaultPrevented
  ) return
  var el = e.target
  while (el && el.nodeName != 'A') el = el.parentNode
  if (
    !el || el.nodeName != 'A'
    || el[HAS_ATTRIBUTE]('download')
    || !el[HAS_ATTRIBUTE]('href')
    || el.target && el.target != '_self'
    || el.href.indexOf(loc.href.match(RE_ORIGIN)[0]) == -1
  ) return
  if (el.href != loc.href) {
    if (
      el.href.split('#')[0] == loc.href.split('#')[0]
      || base != '#' && getPathFromRoot(el.href).indexOf(base) !== 0
      || !go(getPathFromBase(el.href), el.title || doc.title)
    ) return
  }
  e.preventDefault()
}
function go(path, title) {
  title = title || doc.title
  history.pushState(null, title, base + normalize(path))
  doc.title = title
  routeFound = false
  emit()
  return routeFound
}
prot.m = function(first, second) {
  if (isString(first) && (!second || isString(second))) go(first, second)
  else if (second) this.r(first, second)
  else this.r('@', first)
}
prot.s = function() {
  this.off('*')
  this.$ = []
}
prot.e = function(path) {
  this.$.concat('@').some(function(filter) {
    var args = (filter == '@' ? parser : secondParser)(normalize(path), normalize(filter))
    if (args) {
      this[TRIGGER].apply(null, [filter].concat(args))
      return routeFound = true
    }
  }, this)
}
prot.r = function(filter, action) {
  if (filter != '@') {
    filter = '/' + normalize(filter)
    this.$.push(filter)
  }
  this.on(filter, action)
}
var mainRouter = new Router()
var route = mainRouter.m.bind(mainRouter)
route.create = function() {
  var newSubRouter = new Router()
  newSubRouter.m.stop = newSubRouter.s.bind(newSubRouter)
  return newSubRouter.m.bind(newSubRouter)
}
route.base = function(arg) {
  base = arg || '#'
  current = getPathFromBase()
}
route.exec = function() {
  emit(true)
}
route.parser = function(fn, fn2) {
  if (!fn && !fn2) {
    parser = DEFAULT_PARSER
    secondParser = DEFAULT_SECOND_PARSER
  }
  if (fn) parser = fn
  if (fn2) secondParser = fn2
}
route.query = function() {
  var q = {}
  loc.href[REPLACE](/[?&](.+?)=([^&]*)/g, function(_, k, v) { q[k] = v })
  return q
}
route.stop = function () {
  if (started) {
    win[REMOVE_EVENT_LISTENER](POPSTATE, emit)
    doc[REMOVE_EVENT_LISTENER](clickEvent, click)
    central[TRIGGER]('stop')
    started = false
  }
}
route.start = function (autoExec) {
  if (!started) {
    win[ADD_EVENT_LISTENER](POPSTATE, emit)
    doc[ADD_EVENT_LISTENER](clickEvent, click)
    started = true
  }
  if (autoExec) emit(true)
}
route.base()
route.parser()
riot.route = route
})(riot)
/* istanbul ignore next */
var brackets = (function (UNDEF) {
  var
    REGLOB  = 'g',
    MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,
    STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'/g,
    S_QBSRC = STRINGS.source + '|' +
      /(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/])/.source + '|' +
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source,
    DEFAULT = '{ }',
    FINDBRACES = {
      '(': _regExp('([()])|'   + S_QBSRC, REGLOB),
      '[': _regExp('([[\\]])|' + S_QBSRC, REGLOB),
      '{': _regExp('([{}])|'   + S_QBSRC, REGLOB)
    }
  var
    cachedBrackets = UNDEF,
    _regex,
    _pairs = []
  function _regExp(source, flags) { return new RegExp(source, flags) }
  function _loopback(re) { return re }
  function _rewrite(re) {
    return new RegExp(
      re.source.replace(/{/g, _pairs[2]).replace(/}/g, _pairs[3]), re.global ? REGLOB : ''
    )
  }
  function _reset(pair) {
    pair = pair || DEFAULT
    if (pair !== _pairs[8]) {
      var bp = pair.split(' ')
      if (pair === DEFAULT) {
        _pairs = bp.concat(bp)
        _regex = _loopback
      }
      else {
        if (bp.length !== 2 || /[\x00-\x1F<>a-zA-Z0-9'",;\\]/.test(pair)) {
          throw new Error('Unsupported brackets "' + pair + '"')
        }
        _pairs = bp.concat(pair.replace(/(?=[[\]()*+?.^$|])/g, '\\').split(' '))
        _regex = _rewrite
      }
      _pairs[4] = _regex(_pairs[1].length > 1 ? /{[\S\s]*?}/ : /{[^}]*}/)
      _pairs[5] = _regex(/\\({|})/g)
      _pairs[6] = _regex(/(\\?)({)/g)
      _pairs[7] = _regExp('(\\\\?)(?:([[({])|(' + _pairs[3] + '))|' + S_QBSRC, REGLOB)
      _pairs[9] = _regex(/^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S+)\s*}/)
      _pairs[8] = pair
      _brackets._rawOffset = _pairs[0].length
    }
    _brackets.settings.brackets = cachedBrackets = pair
  }
  function _brackets(reOrIdx) {
    _reset(_brackets.settings.brackets)
    return reOrIdx instanceof RegExp ? _regex(reOrIdx) : _pairs[reOrIdx]
  }
  _brackets.split = function split(str, tmpl) {
    var
      parts = [],
      match,
      isexpr,
      start,
      pos,
      re = _brackets(6)
    isexpr = start = re.lastIndex = 0
    while (match = re.exec(str)) {
      pos = match.index
      if (isexpr) {
        if (match[2]) {
          re.lastIndex = skipBraces(match[2], re.lastIndex)
          continue
        }
        if (!match[3])
          continue
      }
      if (!match[1]) {
        unescapeStr(str.slice(start, pos))
        start = re.lastIndex
        re = _pairs[6 + (isexpr ^= 1)]
        re.lastIndex = start
      }
    }
    if (str && start < str.length) {
      unescapeStr(str.slice(start))
    }
    return parts
    function unescapeStr(str) {
      if (tmpl || isexpr)
        parts.push(str && str.replace(_pairs[5], '$1'))
      else
        parts.push(str)
    }
    function skipBraces(ch, pos) {
      var
        match,
        recch = FINDBRACES[ch],
        level = 1
      recch.lastIndex = pos
      while (match = recch.exec(str)) {
        if (match[1] &&
          !(match[1] === ch ? ++level : --level)) break
      }
      return match ? recch.lastIndex : str.length
    }
  }
  _brackets.hasExpr = function hasExpr(str) {
    return _brackets(4).test(str)
  }
  _brackets.loopKeys = function loopKeys(expr) {
    var m = expr.match(_brackets(9))
    return m ?
      { key: m[1], pos: m[2], val: _pairs[0] + m[3] + _pairs[1] } : { val: expr.trim() }
  }
  _brackets.array = function array(pair) {
    _reset(pair || _brackets.settings.brackets)
    return _pairs
  }
  /* istanbul ignore next: in the node version riot is not in the scope */
  _brackets.settings = typeof riot !== 'undefined' && riot.settings || {}
  _brackets.set = _reset
  _brackets.R_STRINGS = STRINGS
  _brackets.R_MLCOMMS = MLCOMMS
  _brackets.S_QBLOCKS = S_QBSRC
  _reset(_brackets.settings.brackets)
  return _brackets
})()
var tmpl = (function () {
  var
    FALSE  = !1,
    _cache = {}
  function _tmpl(str, data) {
    if (!str) return str
    return (_cache[str] || (_cache[str] = _create(str))).call(data, _logErr)
  }
  function _isRaw(expr) {
    return expr[brackets._rawOffset] === '='
  }
  _tmpl.hasExpr = brackets.hasExpr
  _tmpl.loopKeys = brackets.loopKeys
  _tmpl.errorHandler = FALSE
  _tmpl.isRaw = _isRaw
  function _logErr(err, ctx) {
    if (_tmpl.errorHandler) {
      err.riotData = {
        tagName: ctx && ctx.root && ctx.root.tagName,
        _riot_id: ctx && ctx._riot_id
      }
      _tmpl.errorHandler(err)
    }
  }
  function _create(str) {
    var expr = _getTmpl(str)
    if (expr.slice(0, 11) !== 'try{return ') expr = 'return ' + expr
    return new Function('E', expr + ';')
  }
  var
    RE_QBLOCK = new RegExp(brackets.S_QBLOCKS, 'g'),
    RE_QBMARK = /\x01(\d+)~/g
  function _getTmpl(str) {
    var
      qstr = [],
      expr,
      parts = brackets.split(str, 1)
    if (parts.length > 2 || parts[0]) {
      var i, j, list = []
      for (i = j = 0; i < parts.length; ++i) {
        expr = parts[i]
        if (expr && (expr = i & 1 ?
              _parseExpr(expr, 1, qstr) :
              '"' + expr
                .replace(/\\/g, '\\\\')
                .replace(/\r\n?|\n/g, '\\n')
                .replace(/"/g, '\\"') +
              '"'
          )) list[j++] = expr
      }
      expr = j < 2 ? list[0] :
             '[' + list.join(',') + '].join("")'
    }
    else {
      expr = _parseExpr(parts[1], 0, qstr)
    }
    if (qstr[0])
      expr = expr.replace(RE_QBMARK, function (_, pos) {
        return qstr[pos]
          .replace(/\r/g, '\\r')
          .replace(/\n/g, '\\n')
      })
    return expr
  }
  var
    CS_IDENT = /^(?:(-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*)|\x01(\d+)~):/,
    RE_BRACE = /,|([[{(])|$/g
  function _parseExpr(expr, asText, qstr) {
    if (expr[0] === '=') {
      expr = expr.slice(1)
      console.log('--- RAW: ' + expr)
    }
    expr = expr
          .replace(RE_QBLOCK, function (s, div) {
            return s.length > 2 && !div ? '\x01' + (qstr.push(s) - 1) + '~' : s
          })
          .replace(/\s+/g, ' ').trim()
          .replace(/\ ?([[\({},?\.:])\ ?/g, '$1')
    if (expr) {
      var
        list = [],
        cnt = 0,
        match
      while (expr &&
            (match = expr.match(CS_IDENT)) &&
            !match.index
        ) {
        var
          key,
          jsb,
          re = /,|([[{(])|$/g
        expr = RegExp.rightContext
        key  = match[2] ? qstr[match[2]].slice(1, -1).trim().replace(/\s+/g, ' ') : match[1]
        while (jsb = (match = re.exec(expr))[1]) skipBraces(jsb, re)
        jsb  = expr.slice(0, match.index)
        expr = RegExp.rightContext
        list[cnt++] = _wrapExpr(jsb, 1, key)
      }
      expr = !cnt ? _wrapExpr(expr, asText) :
          cnt > 1 ? '[' + list.join(',') + '].join(" ").trim()' : list[0]
    }
    return expr
    function skipBraces(jsb, re) {
      var
        match,
        lv = 1,
        ir = jsb === '(' ? /[()]/g : jsb === '[' ? /[[\]]/g : /[{}]/g
      ir.lastIndex = re.lastIndex
      while (match = ir.exec(expr)) {
        if (match[0] === jsb) ++lv
        else if (!--lv) break
      }
      re.lastIndex = lv ? expr.length : ir.lastIndex
    }
  }
  // istanbul ignore next: not both
  var JS_CONTEXT = '"in this?this:' + (typeof window !== 'object' ? 'global' : 'window') + ').'
  var JS_VARNAME = /[,{][$\w]+:|(^ *|[^$\w\.])(?!(?:typeof|true|false|null|undefined|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g
  function _wrapExpr(expr, asText, key) {
    var tb = FALSE
    expr = expr.replace(JS_VARNAME, function (match, p, mvar, pos, s) {
      if (mvar) {
        pos = tb ? 0 : pos + match.length
        if (mvar !== 'this' && mvar !== 'global' && mvar !== 'window') {
          match = p + '("' + mvar + JS_CONTEXT + mvar
          if (pos) tb = (s = s[pos]) === '.' || s === '(' || s === '['
        }
        else if (pos)
          tb = !/^(?=(\.[$\w]+))\1(?:[^.[(]|$)/.test(s.slice(pos))
      }
      return match
    })
    if (tb) {
      expr = 'try{return ' + expr + '}catch(e){E(e,this)}'
    }
    if (key) {
      expr = (tb ?
          'function(){' + expr + '}.call(this)' : '(' + expr + ')'
        ) + '?"' + key + '":""'
    }
    else if (asText) {
      expr = 'function(v){' + (tb ?
          expr.replace('return ', 'v=') : 'v=(' + expr + ')'
        ) + ';return v||v===0?v:""}.call(this)'
    }
    return expr
  }
  // istanbul ignore next: compatibility fix for beta versions
  _tmpl.parse = function (s) { return s }
  return _tmpl
})()
var mkdom = (function (checkIE) {
  var rootEls = {
      'tr': 'tbody',
      'th': 'tr',
      'td': 'tr',
      'tbody': 'table',
      'col': 'colgroup'
    },
    GENERIC = 'div'
  checkIE = checkIE && checkIE < 10
  function _mkdom(html) {
    var match = html && html.match(/^\s*<([-\w]+)/),
      tagName = match && match[1].toLowerCase(),
      rootTag = rootEls[tagName] || GENERIC,
      el = mkEl(rootTag)
    el.stub = true
    /* istanbul ignore next */
    if (checkIE && tagName && (match = tagName.match(SPECIAL_TAGS_REGEX)))
      ie9elem(el, html, tagName, !!match[1])
    else
      el.innerHTML = html
    return el
  }
  /* istanbul ignore next */
  function ie9elem(el, html, tagName, select) {
    var div = mkEl(GENERIC),
      tag = select ? 'select>' : 'table>',
      child
    div.innerHTML = '<' + tag + html + '</' + tag
    child = $(tagName, div)
    if (child)
      el.appendChild(child)
  }
  return _mkdom
})(IE_VERSION)
function mkitem(expr, key, val) {
  var item = {}
  item[expr.key] = key
  if (expr.pos) item[expr.pos] = val
  return item
}
function unmountRedundant(items, tags) {
  var i = tags.length,
    j = items.length
  while (i > j) {
    var t = tags[--i]
    tags.splice(i, 1)
    t.unmount()
  }
}
function moveNestedTags(child, i) {
  Object.keys(child.tags).forEach(function(tagName) {
    var tag = child.tags[tagName]
    if (isArray(tag))
      each(tag, function (t) {
        moveChildTag(t, tagName, i)
      })
    else
      moveChildTag(tag, tagName, i)
  })
}
function addVirtual(tag, src, target) {
  var el = tag._root
  tag._virts = []
  while (el) {
    var sib = el.nextSibling
    if (target)
      src.insertBefore(el, target._root)
    else
      src.appendChild(el)
    tag._virts.push(el)
    el = sib
  }
}
function moveVirtual(tag, src, target, len) {
  var el = tag._root
  for (var i = 0; i < len; i++) {
    var sib = el.nextSibling
    src.insertBefore(el, target._root)
    el = sib
  }
}
function _each(dom, parent, expr) {
  remAttr(dom, 'each')
  var mustReorder = typeof getAttr(dom, 'no-reorder') !== T_STRING || remAttr(dom, 'no-reorder'),
    tagName = getTagName(dom),
    impl = __tagImpl[tagName] || { tmpl: dom.outerHTML },
    useRoot = SPECIAL_TAGS_REGEX.test(tagName),
    root = dom.parentNode,
    ref = document.createTextNode(''),
    child = getTag(dom),
    isOption = /option/gi.test(tagName),
    tags = [],
    oldItems = [],
    hasKeys,
    isVirtual = dom.tagName == 'VIRTUAL'
  expr = tmpl.loopKeys(expr)
  root.insertBefore(ref, dom)
  parent.one('before-mount', function () {
    dom.parentNode.removeChild(dom)
    if (root.stub) root = parent.root
  }).on('update', function () {
    var items = tmpl(expr.val, parent),
      frag = document.createDocumentFragment()
    if (!isArray(items)) {
      hasKeys = items || false
      items = hasKeys ?
        Object.keys(items).map(function (key) {
          return mkitem(expr, key, items[key])
        }) : []
    }
    each(items, function(item, i) {
      var _mustReorder = mustReorder && item instanceof Object,
        oldPos = oldItems.indexOf(item),
        pos = ~oldPos && _mustReorder ? oldPos : i,
        tag = tags[pos]
      item = !hasKeys && expr.key ? mkitem(expr, item, i) : item
      if (
        !_mustReorder && !tag
        ||
        _mustReorder && !~oldPos || !tag
      ) {
        tag = new Tag(impl, {
          parent: parent,
          isLoop: true,
          hasImpl: !!__tagImpl[tagName],
          root: useRoot ? root : dom.cloneNode(),
          item: item
        }, dom.innerHTML)
        tag.mount()
        if (isVirtual) tag._root = tag.root.firstChild
        if (i == tags.length) {
          if (isVirtual)
            addVirtual(tag, frag)
          else frag.appendChild(tag.root)
        }
        else {
          if (isVirtual)
            addVirtual(tag, root, tags[i])
          else root.insertBefore(tag.root, tags[i].root)
          oldItems.splice(i, 0, item)
        }
        tags.splice(i, 0, tag)
        pos = i
      } else tag.update(item)
      if (pos !== i && _mustReorder) {
        if (isVirtual)
          moveVirtual(tag, root, tags[i], dom.childNodes.length)
        else root.insertBefore(tag.root, tags[i].root)
        if (expr.pos)
          tag[expr.pos] = i
        tags.splice(i, 0, tags.splice(pos, 1)[0])
        oldItems.splice(i, 0, oldItems.splice(pos, 1)[0])
        if (!child) moveNestedTags(tag, i)
      }
      tag._item = item
      defineProperty(tag, '_parent', parent)
    })
    unmountRedundant(items, tags)
    if (isOption) root.appendChild(frag)
    else root.insertBefore(frag, ref)
    if (child) parent.tags[tagName] = tags
    oldItems = items.slice()
  })
}
function parseNamedElements(root, tag, childTags, forceParsingNamed) {
  walk(root, function(dom) {
    if (dom.nodeType == 1) {
      dom.isLoop = dom.isLoop || (dom.parentNode && dom.parentNode.isLoop || getAttr(dom, 'each')) ? 1 : 0
      if (childTags) {
        var child = getTag(dom)
        if (child && !dom.isLoop)
          childTags.push(initChildTag(child, {root: dom, parent: tag}, dom.innerHTML, tag))
      }
      if (!dom.isLoop || forceParsingNamed)
        setNamed(dom, tag, [])
    }
  })
}
function parseExpressions(root, tag, expressions) {
  function addExpr(dom, val, extra) {
    if (tmpl.hasExpr(val)) {
      var expr = { dom: dom, expr: val }
      expressions.push(extend(expr, extra))
    }
  }
  walk(root, function(dom) {
    var type = dom.nodeType
    if (type == 3 && dom.parentNode.tagName != 'STYLE') addExpr(dom, dom.nodeValue)
    if (type != 1) return
    var attr = getAttr(dom, 'each')
    if (attr) { _each(dom, tag, attr); return false }
    each(dom.attributes, function(attr) {
      var name = attr.name,
        bool = name.split('__')[1]
      addExpr(dom, attr.value, { attr: bool || name, bool: bool })
      if (bool) { remAttr(dom, name); return false }
    })
    if (getTag(dom)) return false
  })
}
function Tag(impl, conf, innerHTML) {
  var self = riot.observable(this),
    opts = inherit(conf.opts) || {},
    dom = mkdom(impl.tmpl),
    parent = conf.parent,
    isLoop = conf.isLoop,
    hasImpl = conf.hasImpl,
    item = cleanUpData(conf.item),
    expressions = [],
    childTags = [],
    root = conf.root,
    fn = impl.fn,
    tagName = root.tagName.toLowerCase(),
    attr = {},
    propsInSyncWithParent = []
  if (fn && root._tag) root._tag.unmount(true)
  this.isMounted = false
  root.isLoop = isLoop
  root._tag = this
  defineProperty(this, '_riot_id', ++__uid)
  extend(this, { parent: parent, root: root, opts: opts, tags: {} }, item)
  each(root.attributes, function(el) {
    var val = el.value
    if (tmpl.hasExpr(val)) attr[el.name] = val
  })
  if (dom.innerHTML && !/^(select|optgroup|table|tbody|tr|col(?:group)?)$/.test(tagName))
    dom.innerHTML = replaceYield(dom.innerHTML, innerHTML)
  function updateOpts() {
    var ctx = hasImpl && isLoop ? self : parent || self
    each(root.attributes, function(el) {
      opts[toCamel(el.name)] = tmpl(el.value, ctx)
    })
    each(Object.keys(attr), function(name) {
      opts[toCamel(name)] = tmpl(attr[name], ctx)
    })
  }
  function normalizeData(data) {
    for (var key in item) {
      if (typeof self[key] !== T_UNDEF && isWritable(self, key))
        self[key] = data[key]
    }
  }
  function inheritFromParent () {
    if (!self.parent || !isLoop) return
    each(Object.keys(self.parent), function(k) {
      var mustSync = !contains(RESERVED_WORDS_BLACKLIST, k) && contains(propsInSyncWithParent, k)
      if (typeof self[k] === T_UNDEF || mustSync) {
        if (!mustSync) propsInSyncWithParent.push(k)
        self[k] = self.parent[k]
      }
    })
  }
  defineProperty(this, 'update', function(data) {
    data = cleanUpData(data)
    inheritFromParent()
    if (data && typeof item === T_OBJECT) {
      normalizeData(data)
      item = data
    }
    extend(self, data)
    updateOpts()
    self.trigger('update', data)
    update(expressions, self)
    self.trigger('updated')
    return this
  })
  defineProperty(this, 'mixin', function() {
    each(arguments, function(mix) {
      mix = typeof mix === T_STRING ? riot.mixin(mix) : mix
      each(Object.keys(mix), function(key) {
        if (key != 'init')
          self[key] = isFunction(mix[key]) ? mix[key].bind(self) : mix[key]
      })
      if (mix.init) mix.init.bind(self)()
    })
    return this
  })
  defineProperty(this, 'mount', function() {
    updateOpts()
    if (fn) fn.call(self, opts)
    parseExpressions(dom, self, expressions)
    toggle(true)
    if (impl.attrs || hasImpl) {
      walkAttributes(impl.attrs, function (k, v) { setAttr(root, k, v) })
      parseExpressions(self.root, self, expressions)
    }
    if (!self.parent || isLoop) self.update(item)
    self.trigger('before-mount')
    if (isLoop && !hasImpl) {
      self.root = root = dom.firstChild
    } else {
      while (dom.firstChild) root.appendChild(dom.firstChild)
      if (root.stub) self.root = root = parent.root
    }
    if (isLoop)
      parseNamedElements(self.root, self.parent, null, true)
    if (!self.parent || self.parent.isMounted) {
      self.isMounted = true
      self.trigger('mount')
    }
    else self.parent.one('mount', function() {
      if (!isInStub(self.root)) {
        self.parent.isMounted = self.isMounted = true
        self.trigger('mount')
      }
    })
  })
  defineProperty(this, 'unmount', function(keepRootTag) {
    var el = root,
      p = el.parentNode,
      ptag
    self.trigger('before-unmount')
    __virtualDom.splice(__virtualDom.indexOf(self), 1)
    if (this._virts) {
      each(this._virts, function(v) {
        v.parentNode.removeChild(v)
      })
    }
    if (p) {
      if (parent) {
        ptag = getImmediateCustomParentTag(parent)
        if (isArray(ptag.tags[tagName]))
          each(ptag.tags[tagName], function(tag, i) {
            if (tag._riot_id == self._riot_id)
              ptag.tags[tagName].splice(i, 1)
          })
        else
          ptag.tags[tagName] = undefined
      }
      else
        while (el.firstChild) el.removeChild(el.firstChild)
      if (!keepRootTag)
        p.removeChild(el)
      else
        remAttr(p, 'riot-tag')
    }
    self.trigger('unmount')
    toggle()
    self.off('*')
    self.isMounted = false
    root._tag = null
  })
  function toggle(isMount) {
    each(childTags, function(child) { child[isMount ? 'mount' : 'unmount']() })
    if (parent) {
      var evt = isMount ? 'on' : 'off'
      if (isLoop)
        parent[evt]('unmount', self.unmount)
      else
        parent[evt]('update', self.update)[evt]('unmount', self.unmount)
    }
  }
  parseNamedElements(dom, this, childTags)
}
function setEventHandler(name, handler, dom, tag) {
  dom[name] = function(e) {
    var ptag = tag._parent,
      item = tag._item,
      el
    if (!item)
      while (ptag && !item) {
        item = ptag._item
        ptag = ptag._parent
      }
    e = e || window.event
    if (isWritable(e, 'currentTarget')) e.currentTarget = dom
    if (isWritable(e, 'target')) e.target = e.srcElement
    if (isWritable(e, 'which')) e.which = e.charCode || e.keyCode
    e.item = item
    if (handler.call(tag, e) !== true && !/radio|check/.test(dom.type)) {
      if (e.preventDefault) e.preventDefault()
      e.returnValue = false
    }
    if (!e.preventUpdate) {
      el = item ? getImmediateCustomParentTag(ptag) : tag
      el.update()
    }
  }
}
function insertTo(root, node, before) {
  if (root) {
    root.insertBefore(before, node)
    root.removeChild(node)
  }
}
function update(expressions, tag) {
  each(expressions, function(expr, i) {
    var dom = expr.dom,
      attrName = expr.attr,
      value = tmpl(expr.expr, tag),
      parent = expr.dom.parentNode
    if (expr.bool)
      value = value ? attrName : false
    else if (value == null)
      value = ''
    if (parent && parent.tagName == 'TEXTAREA') value = ('' + value).replace(/riot-/g, '')
    if (expr.value === value) return
    expr.value = value
    if (!attrName) {
      if (tmpl.isRaw(expr.expr)) {
        var id = dom._riot_rawId, box
        if (id) {
          box = $('span[_riot_id="' + id + '"]', dom.parentNode)
          if (box) dom.parentNode.removeChild(box)
        }
        box = mkEl('span')
        dom.parentNode.insertBefore(box, dom)
        dom._riot_rawId = id = id || ++__uid
        setAttr(box, '_riot_id', id)
        box.innerHTML = value
        value = ''
      }
      dom.nodeValue = '' + value
      return
    }
    remAttr(dom, attrName)
    if (isFunction(value)) {
      setEventHandler(attrName, value, dom, tag)
    } else if (attrName == 'if') {
      var stub = expr.stub,
        add = function() { insertTo(stub.parentNode, stub, dom) },
        remove = function() { insertTo(dom.parentNode, dom, stub) }
      if (value) {
        if (stub) {
          add()
          dom.inStub = false
          if (!isInStub(dom)) {
            walk(dom, function(el) {
              if (el._tag && !el._tag.isMounted) el._tag.isMounted = !!el._tag.trigger('mount')
            })
          }
        }
      } else {
        stub = expr.stub = stub || document.createTextNode('')
        if (dom.parentNode)
          remove()
        else (tag.parent || tag).one('updated', remove)
        dom.inStub = true
      }
    } else if (/^(show|hide)$/.test(attrName)) {
      if (attrName == 'hide') value = !value
      dom.style.display = value ? '' : 'none'
    } else if (attrName == 'value') {
      dom.value = value
    } else if (startsWith(attrName, RIOT_PREFIX) && attrName != RIOT_TAG) {
      if (value)
        setAttr(dom, attrName.slice(RIOT_PREFIX.length), value)
    } else {
      if (expr.bool) {
        dom[attrName] = value
        if (!value) return
      }
      if (typeof value !== T_OBJECT) setAttr(dom, attrName, value)
    }
  })
}
function each(els, fn) {
  for (var i = 0, len = (els || []).length, el; i < len; i++) {
    el = els[i]
    if (el != null && fn(el, i) === false) i--
  }
  return els
}
function isFunction(v) {
  return typeof v === T_FUNCTION || false
}
function remAttr(dom, name) {
  dom.removeAttribute(name)
}
function toCamel(string) {
  return string.replace(/(\-\w)/g, function(match) {
    return match.toUpperCase().replace('-', '')
  })
}
function getAttr(dom, name) {
  return dom.getAttribute(name)
}
function setAttr(dom, name, val) {
  dom.setAttribute(name, val)
}
function getTag(dom) {
  return dom.tagName && __tagImpl[getAttr(dom, RIOT_TAG) || dom.tagName.toLowerCase()]
}
function addChildTag(tag, tagName, parent) {
  var cachedTag = parent.tags[tagName]
  if (cachedTag) {
    if (!isArray(cachedTag))
      if (cachedTag !== tag)
        parent.tags[tagName] = [cachedTag]
    if (!contains(parent.tags[tagName], tag))
      parent.tags[tagName].push(tag)
  } else {
    parent.tags[tagName] = tag
  }
}
function moveChildTag(tag, tagName, newPos) {
  var parent = tag.parent,
    tags
  if (!parent) return
  tags = parent.tags[tagName]
  if (isArray(tags))
    tags.splice(newPos, 0, tags.splice(tags.indexOf(tag), 1)[0])
  else addChildTag(tag, tagName, parent)
}
function initChildTag(child, opts, innerHTML, parent) {
  var tag = new Tag(child, opts, innerHTML),
    tagName = getTagName(opts.root),
    ptag = getImmediateCustomParentTag(parent)
  tag.parent = ptag
  tag._parent = parent
  addChildTag(tag, tagName, ptag)
  if (ptag !== parent)
    addChildTag(tag, tagName, parent)
  opts.root.innerHTML = ''
  return tag
}
function getImmediateCustomParentTag(tag) {
  var ptag = tag
  while (!getTag(ptag.root)) {
    if (!ptag.parent) break
    ptag = ptag.parent
  }
  return ptag
}
function defineProperty(el, key, value, options) {
  Object.defineProperty(el, key, extend({
    value: value,
    enumerable: false,
    writable: false,
    configurable: false
  }, options))
  return el
}
function getTagName(dom) {
  var child = getTag(dom),
    namedTag = getAttr(dom, 'name'),
    tagName = namedTag && !tmpl.hasExpr(namedTag) ?
                namedTag :
              child ? child.name : dom.tagName.toLowerCase()
  return tagName
}
function extend(src) {
  var obj, args = arguments
  for (var i = 1; i < args.length; ++i) {
    if (obj = args[i]) {
      for (var key in obj) {
        if (isWritable(src, key))
          src[key] = obj[key]
      }
    }
  }
  return src
}
function contains(arr, item) {
  return ~arr.indexOf(item)
}
function isArray(a) { return Array.isArray(a) || a instanceof Array }
function isWritable(obj, key) {
  var props = Object.getOwnPropertyDescriptor(obj, key)
  return typeof obj[key] === T_UNDEF || props && props.writable
}
function cleanUpData(data) {
  if (!(data instanceof Tag) && !(data && typeof data.trigger == T_FUNCTION)) return data
  var o = {}
  for (var key in data) {
    if (!contains(RESERVED_WORDS_BLACKLIST, key))
      o[key] = data[key]
  }
  return o
}
function walk(dom, fn) {
  if (dom) {
    if (fn(dom) === false) return
    else {
      dom = dom.firstChild
      while (dom) {
        walk(dom, fn)
        dom = dom.nextSibling
      }
    }
  }
}
function walkAttributes(html, fn) {
  var m,
    re = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g
  while (m = re.exec(html)) {
    fn(m[1].toLowerCase(), m[2] || m[3] || m[4])
  }
}
function isInStub(dom) {
  while (dom) {
    if (dom.inStub) return true
    dom = dom.parentNode
  }
  return false
}
function mkEl(name) {
  return document.createElement(name)
}
function replaceYield(tmpl, innerHTML) {
  return tmpl.replace(/<yield\s*(?:\/>|>\s*<\/yield\s*>)/gi, innerHTML || '')
}
function $$(selector, ctx) {
  return (ctx || document).querySelectorAll(selector)
}
function $(selector, ctx) {
  return (ctx || document).querySelector(selector)
}
function inherit(parent) {
  function Child() {}
  Child.prototype = parent
  return new Child()
}
function getNamedKey(dom) {
  return getAttr(dom, 'id') || getAttr(dom, 'name')
}
function setNamed(dom, parent, keys) {
  var key = getNamedKey(dom),
    add = function(value) {
      if (contains(keys, key)) return
      var isArr = isArray(value)
      if (!value)
        parent[key] = dom
      else if (!isArr || isArr && !contains(value, dom)) {
        if (isArr)
          value.push(dom)
        else
          parent[key] = [value, dom]
      }
    }
  if (!key) return
  if (tmpl.hasExpr(key))
    parent.one('updated', function() {
      key = getNamedKey(dom)
      add(parent[key])
    })
  else
    add(parent[key])
}
function startsWith(src, str) {
  return src.slice(0, str.length) === str
}
var injectStyle = (function() {
  if (!window) return
  var styleNode = mkEl('style'),
    placeholder = $('style[type=riot]')
  setAttr(styleNode, 'type', 'text/css')
  if (placeholder) {
    placeholder.parentNode.replaceChild(styleNode, placeholder)
    placeholder = null
  }
  else document.getElementsByTagName('head')[0].appendChild(styleNode)
  return styleNode.styleSheet ?
    function (css) { styleNode.styleSheet.cssText += css } :
    function (css) { styleNode.innerHTML += css }
})()
function mountTo(root, tagName, opts) {
  var tag = __tagImpl[tagName],
    innerHTML = root._innerHTML = root._innerHTML || root.innerHTML
  root.innerHTML = ''
  if (tag && root) tag = new Tag(tag, { root: root, opts: opts }, innerHTML)
  if (tag && tag.mount) {
    tag.mount()
    if (!contains(__virtualDom, tag)) __virtualDom.push(tag)
  }
  return tag
}
riot.util = { brackets: brackets, tmpl: tmpl }
riot.mixin = (function() {
  var mixins = {}
  return function(name, mixin) {
    if (!mixin) return mixins[name]
    mixins[name] = mixin
  }
})()
riot.tag = function(name, html, css, attrs, fn) {
  if (isFunction(attrs)) {
    fn = attrs
    if (/^[\w\-]+\s?=/.test(css)) {
      attrs = css
      css = ''
    } else attrs = ''
  }
  if (css) {
    if (isFunction(css)) fn = css
    else if (injectStyle) injectStyle(css)
  }
  __tagImpl[name] = { name: name, tmpl: html, attrs: attrs, fn: fn }
  return name
}
riot.tag2 = function(name, html, css, attrs, fn, bpair) {
  if (css && injectStyle) injectStyle(css)
  __tagImpl[name] = { name: name, tmpl: html, attrs: attrs, fn: fn }
  return name
}
riot.mount = function(selector, tagName, opts) {
  var els,
    allTags,
    tags = []
  function addRiotTags(arr) {
    var list = ''
    each(arr, function (e) {
      list += ', *[' + RIOT_TAG + '="' + e.trim() + '"]'
    })
    return list
  }
  function selectAllTags() {
    var keys = Object.keys(__tagImpl)
    return keys + addRiotTags(keys)
  }
  function pushTags(root) {
    var last
    if (root.tagName) {
      if (tagName && (!(last = getAttr(root, RIOT_TAG)) || last != tagName))
        setAttr(root, RIOT_TAG, tagName)
      var tag = mountTo(root, tagName || root.getAttribute(RIOT_TAG) || root.tagName.toLowerCase(), opts)
      if (tag) tags.push(tag)
    } else if (root.length)
      each(root, pushTags)
  }
  if (typeof tagName === T_OBJECT) {
    opts = tagName
    tagName = 0
  }
  if (typeof selector === T_STRING) {
    if (selector === '*')
      selector = allTags = selectAllTags()
    else
      selector += addRiotTags(selector.split(','))
    els = selector ? $$(selector) : []
  }
  else
    els = selector
  if (tagName === '*') {
    tagName = allTags || selectAllTags()
    if (els.tagName)
      els = $$(tagName, els)
    else {
      var nodeList = []
      each(els, function (_el) {
        nodeList.push($$(tagName, _el))
      })
      els = nodeList
    }
    tagName = 0
  }
  if (els.tagName)
    pushTags(els)
  else
    each(els, pushTags)
  return tags
}
riot.update = function() {
  return each(__virtualDom, function(tag) {
    tag.update()
  })
}
riot.Tag = Tag
/* istanbul ignore next */
var parsers = (function () {
  var _mods = {}
  function _try(name, req) {
    switch (name) {
    case 'coffee':
      req = 'CoffeeScript'
      break
    case 'es6':
      req = 'babel'
      break
    default:
      if (!req) req = name
      break
    }
    return _mods[name] = window[req]
  }
  function _req(name, req) {
    return name in _mods ? _mods[name] : _try(name, req)
  }
  var _html = {
    jade: function (html, opts) {
      return _req('jade').render(html, extend({pretty: true, doctype: 'html'}, opts))
    }
  }
  var _css = {
    stylus: function (tag, css, opts) {
      var
        stylus = _req('stylus'), nib = _req('nib')
      /* istanbul ignore next: can't run both */
      return nib ?
        stylus(css).use(nib()).import('nib').render() : stylus.render(css)
    }
  }
  var _js = {
    none: function (js, opts) {
      return js
    },
    livescript: function (js, opts) {
      return _req('livescript').compile(js, extend({bare: true, header: false}, opts))
    },
    typescript: function (js, opts) {
      return _req('typescript')(js, opts).replace(/\r\n?/g, '\n')
    },
    es6: function (js, opts) {
      return _req('es6').transform(js, extend({
        blacklist: ['useStrict', 'strict', 'react'], sourceMaps: false, comments: false
      }, opts)).code
    },
    babel: function (js, opts) {
      js = 'function __parser_babel_wrapper__(){' + js + '}'
      return _req('babel').transform(js,
        extend({
          presets: ['es2015']
        }, opts)
      ).code.replace(/["']use strict["'];[\r\n]+/, '').slice(38, -2)
    },
    coffee: function (js, opts) {
      return _req('coffee').compile(js, extend({bare: true}, opts))
    }
  }
  _js.javascript   = _js.none
  _js.coffeescript = _js.coffee
  return {html: _html, css: _css, js: _js, _req: _req}
})()
riot.parsers = parsers
var compile = (function () {
  var brackets = riot.util.brackets
  function _regEx(str, opt) { return new RegExp(str, opt) }
  var
    BOOL_ATTRS = _regEx(
      '^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|' +
      'compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|' +
      'multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|' +
      'selected|sortable|truespeed|typemustmatch)$'),
    RIOT_ATTRS = ['style', 'src', 'd'],
    VOID_TAGS  = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,
    HTML_ATTR  = /\s*([-\w:\.\xA0-\xFF]+)\s*(?:=\s*('[^']+'|"[^"]+"|\S+))?/g,
    TRIM_TRAIL = /[ \t]+$/gm,
    _bp = null
  function q(s) {
    return "'" + (s ? s
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') :
      '') + "'"
  }
  function mktag(name, html, css, attrs, js, pcex) {
    var
      c = ', ',
      s = '}' + (pcex.length ? ', ' + q(_bp[8]) : '') + ');'
    if (js && js.slice(-1) !== '\n') s = '\n' + s
    return 'riot.tag2(\'' + name + "'" + c + q(html) + c + q(css) + c + q(attrs) +
           ', function(opts) {\n' + js + s
  }
  function extend(obj, props) {
    for (var prop in props) {
      /* istanbul ignore next */
      if (props.hasOwnProperty(prop)) {
        obj[prop] = props[prop]
      }
    }
    return obj
  }
  function parseAttrs(str) {
    var
      list = [],
      match,
      k, v,
      DQ = '"'
    HTML_ATTR.lastIndex = 0
    str = str.replace(/\s+/g, ' ')
    while (match = HTML_ATTR.exec(str)) {
      k = match[1].toLowerCase()
      v = match[2]
      if (!v) {
        list.push(k)
      }
      else {
        if (v[0] !== DQ)
          v = DQ + (v[0] === "'" ? v.slice(1, -1) : v) + DQ
        if (k === 'type' && v.toLowerCase() === '"number"') {
          v = DQ + _bp[0] + "'number'" + _bp[1] + DQ
        }
        else if (/\u0001\d/.test(v)) {
          if (BOOL_ATTRS.test(k)) {
            k = '__' + k
          }
          else if (~RIOT_ATTRS.indexOf(k)) {
            k = 'riot-' + k
          }
        }
        list.push(k + '=' + v)
      }
    }
    return list.join(' ')
  }
  function splitHtml(html, opts, pcex) {
    if (html && _bp[4].test(html)) {
      var
        jsfn = opts.expr && (opts.parser || opts.type) ? compileJS : 0,
        list = brackets.split(html),
        expr
      for (var i = 1; i < list.length; i += 2) {
        expr = list[i]
        if (expr[0] === '^')
          expr = expr.slice(1)
        else if (jsfn) {
          var israw = expr[0] === '='
          if (israw) expr = expr.slice(1)
          expr = jsfn(expr, opts)
          if (/;\s*$/.test(expr)) expr = expr.slice(0, expr.search(/;\s*$/))
          if (israw) expr = '=' + expr
        }
        list[i] = '\u0001' + (pcex.push(expr.replace(/[\r\n]+/g, ' ').trim()) - 1) + _bp[1]
      }
      html = list.join('')
    }
    return html
  }
  function restoreExpr(html, pcex) {
    if (pcex.length) {
      html = html
        .replace(/\u0001(\d+)/g, function (_, d) {
          var expr = pcex[d]
          if (expr[0] === '=')
            expr = expr.replace(brackets.R_STRINGS, function (qs) {
              return qs
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
            })
          return _bp[0] + expr
        })
    }
    return html
  }
  var
    HTML_COMMENT = /<!--(?!>)[\S\s]*?-->/g,
    HTML_TAGS = /<([-\w]+)\s*([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)(\/?)>/g
  function compileHTML(html, opts, pcex, intc) {
    if (!intc) {
      _bp = brackets.array(opts.brackets)
      html = html.replace(/\r\n?/g, '\n').replace(HTML_COMMENT, '').replace(TRIM_TRAIL, '')
    }
    if (!pcex) pcex = []
    html = splitHtml(html, opts, pcex)
      .replace(HTML_TAGS, function (_, name, attr, ends) {
        name = name.toLowerCase()
        ends = ends && !VOID_TAGS.test(name) ? '></' + name : ''
        if (attr) name += ' ' + parseAttrs(attr)
        return '<' + name + ends + '>'
      })
    if (!opts.whitespace) {
      var p = [],
        pre = /<pre(?:\s+[^'">]+(?:(?:"[^"]*"|'[^']*')[^'">]*)*|\s*)>[\s\S]*<\/pre\s*>/gi
      html = html.replace(pre, function (q) {
        return '\u0002' + (p.push(q) - 1) + '~' }).trim().replace(/\s+/g, ' ')
      if (p.length)
        html = html.replace(/\u0002(\d+)~/g, function (q, n) { return p[n] })
    }
    if (opts.compact) html = html.replace(/> <([-\w\/])/g, '><$1')
    return restoreExpr(html, pcex)
  }
  var
    JS_RMCOMMS = _regEx(
    '(' + brackets.S_QBLOCKS + ')|' + brackets.R_MLCOMMS.source + '|//[^\r\n]*',
    'g'),
    JS_ES6SIGN = /^([ \t]*)([$_A-Za-z][$\w]*)\s*(\([^()]*\)\s*{)/m
  function riotjs(js) {
    var
      match,
      toes5,
      parts = [],
      pos
    js = js.replace(JS_RMCOMMS, function (m, q) { return q ? m : ' ' })
    while (match = js.match(JS_ES6SIGN)) {
      parts.push(RegExp.leftContext)
      js  = RegExp.rightContext
      pos = skipBlock(js)
      toes5 = !/^(?:if|while|for|switch|catch|function)$/.test(match[2])
      if (toes5)
        match[0] = match[1] + 'this.' + match[2] + ' = function' + match[3]
      parts.push(match[0], js.slice(0, pos))
      js = js.slice(pos)
      if (toes5 && !/^\s*.\s*bind\b/.test(js)) parts.push('.bind(this)')
    }
    return parts.length ? parts.join('') + js : js
    function skipBlock(str) {
      var
        re = _regEx('([{}])|' + brackets.S_QBLOCKS, 'g'),
        level = 1,
        match
      while (level && (match = re.exec(str))) {
        if (match[1])
          match[1] === '{' ? ++level : --level
      }
      return level ? str.length : re.lastIndex
    }
  }
  function compileJS(js, opts, type, parserOpts) {
    if (!js) return ''
    if (!type) type = opts.type
    var parser = opts.parser || (type ? parsers.js[type] : riotjs)
    if (!parser)
      throw new Error('JS parser not found: "' + type + '"')
    return parser(js, parserOpts).replace(TRIM_TRAIL, '')
  }
  var CSS_SELECTOR = _regEx('(}|{|^)[ ;]*([^@ ;{}][^{}]*)(?={)|' + brackets.R_STRINGS.source, 'g')
  function scopedCSS(tag, style) {
    var scope = ':scope'
    return style.replace(CSS_SELECTOR, function (m, p1, p2) {
      if (!p2) return m
      p2 = p2.replace(/[^,]+/g, function (sel) {
        var s = sel.trim()
        if (s && s !== 'from' && s !== 'to' && s.slice(-1) !== '%') {
          if (s.indexOf(scope) < 0) s = scope + ' ' + s
          s = s.replace(scope, tag) + ',' +
              s.replace(scope, '[riot-tag="' + tag + '"]')
        }
        return sel.slice(-1) === ' ' ? s + ' ' : s
      })
      return p1 ? p1 + ' ' + p2 : p2
    })
  }
  function compileCSS(style, tag, type, scoped, opts) {
    if (type) {
      if (type === 'scoped-css') {
        scoped = true
      }
      else if (parsers.css[type]) {
        style = parsers.css[type](tag, style, opts)
      }
      else if (type !== 'css') {
        throw new Error('CSS parser not found: "' + type + '"')
      }
    }
    style = style.replace(brackets.R_MLCOMMS, '').replace(/\s+/g, ' ').trim()
    return scoped ? scopedCSS(tag, style) : style
  }
  var
    TYPE_ATTR = /\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i,
    MISC_ATTR = /\s*=\s*("(?:\\[\S\s]|[^"\\]*)*"|'(?:\\[\S\s]|[^'\\]*)*'|\{[^}]+}|\S+)/.source
  function getType(str) {
    if (str) {
      var match = str.match(TYPE_ATTR)
      str = match && (match[2] || match[3])
    }
    return str ? str.replace('text/', '') : ''
  }
  function getAttr(str, name) {
    if (str) {
      var
        re = _regEx('\\s' + name + MISC_ATTR, 'i'),
        match = str.match(re)
      str = match && match[1]
      if (str)
        return /^['"]/.test(str) ? str.slice(1, -1) : str
    }
    return ''
  }
  function getParserOptions(attrs) {
    var opts = getAttr(attrs, 'options')
    if (opts) opts = JSON.parse(opts)
    return opts
  }
  function getCode(code, opts, attrs, url) {
    var type = getType(attrs),
      parserOpts = getParserOptions(attrs)
    var src = getAttr(attrs, 'src')
    if (src && url) {
      var
        charset = getAttr(attrs, 'charset'),
        file = path.resolve(path.dirname(url), src)
      code = require('fs').readFileSync(file, {encoding: charset || 'utf8'})
    }
    return compileJS(code, opts, type, parserOpts)
  }
  var END_TAGS = /\/>\n|^<(?:\/[\w\-]+\s*|[\w\-]+(?:\s+(?:[-\w:\xA0-\xFF][\S\s]*?)?)?)>\n/
  function splitBlocks(str) {
    var k, m
    /* istanbul ignore next: this if() can't be true, but just in case... */
    if (str[str.length - 1] === '>')
      return [str, '']
    k = str.lastIndexOf('<')
    while (~k) {
      if (m = str.slice(k).match(END_TAGS)) {
        k += m.index + m[0].length
        return [str.slice(0, k), str.slice(k)]
      }
      k = str.lastIndexOf('<', k -1)
    }
    return ['', str]
  }
  function compileTemplate(lang, html, opts) {
    var parser = parsers.html[lang]
    if (!parser)
      throw new Error('Template parser not found: "' + lang + '"')
    return parser(html, opts)
  }
  var
    CUST_TAG = /^([ \t]*)<([-\w]+)(?:\s+([^'"\/>]+(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)|\s*)?(?:\/>|>[ \t]*\n?([\s\S]*)^\1<\/\2\s*>|>(.*)<\/\2\s*>)/gim,
    STYLE = /<style(\s+[^>]*)?>\n?([^<]*(?:<(?!\/style\s*>)[^<]*)*)<\/style\s*>/gi,
    SCRIPT = _regEx(STYLE.source.replace(/tyle/g, 'cript'), 'gi')
  function compile(src, opts, url) {
    var label, exclude, parts = []
    if (!opts) opts = {}
    exclude = opts.exclude || false
    function included(s) { return !exclude || exclude.indexOf(s) < 0 }
    _bp = brackets.array(opts.brackets)
    if (opts.template)
      src = compileTemplate(opts.template, src, opts.templateOptions)
    label = url ? '//src: ' + url + '\n' : ''
    src = label + src
      .replace(/\r\n?/g, '\n')
      .replace(CUST_TAG, function (_, indent, tagName, attribs, body, body2) {
        var
          jscode = '',
          styles = '',
          html = '',
          pcex = []
        tagName = tagName.toLowerCase()
        attribs = attribs && included('attribs') ?
          restoreExpr(parseAttrs(splitHtml(attribs, opts, pcex)), pcex) : ''
        if (body2) body = body2
        if (body && (body = body.replace(HTML_COMMENT, '')) && /\S/.test(body)) {
          if (body2)
            html = included('html') ? compileHTML(body2, opts, pcex, 1) : ''
          else {
            body = body.replace(_regEx('^' + indent, 'gm'), '')
            if (included('css')) {
              body = body.replace(STYLE, function (_, _attrs, _style) {
                var scoped = _attrs && /\sscoped(\s|=|$)/i.test(_attrs),
                  csstype = getType(_attrs) || opts.style
                styles += (styles ? ' ' : '') +
                  compileCSS(_style, tagName, csstype, scoped, getParserOptions(_attrs))
                return ''
              })
            }
            if (included('js')) {
              body = body.replace(SCRIPT, function (_, _attrs, _script) {
                jscode += (jscode ? '\n' : '') + getCode(_script, opts, _attrs, url)
                return ''
              })
            }
            var blocks = splitBlocks(body.replace(TRIM_TRAIL, ''))
            if (included('html')) {
              body = blocks[0]
              if (body)
                html = compileHTML(body, opts, pcex, 1)
            }
            if (included('js')) {
              body = blocks[1]
              if (/\S/.test(body))
                jscode += (jscode ? '\n' : '') + compileJS(body, opts)
            }
          }
        }
        jscode = /\S/.test(jscode) ? jscode.replace(/\n{3,}/g, '\n\n') : ''
        if (opts.entities) {
          parts.push({
            tagName: tagName,
            html: html,
            css: styles,
            attribs: attribs,
            js: jscode
          })
          return ''
        }
        return mktag(tagName, html, styles, attribs, jscode, pcex)
      })
    return opts.entities ? parts : src
  }
  riot.util.compile = {
    html: compileHTML,
    style: compileCSS,
    js: compileJS
  }
  return compile
})()
riot.compile = (function () {
  var
    doc = window.document,
    promise,
    ready
  function GET(url, fn, opts) {
    var req = new XMLHttpRequest()
    req.onreadystatechange = function() {
      if (req.readyState === 4 &&
         (req.status === 200 || !req.status && req.responseText.length))
        fn(req.responseText, opts, url)
    }
    req.open('GET', url, true)
    req.send('')
  }
  function globalEval(js) {
    var
      node = doc.createElement('script'),
      root = doc.documentElement
    node.text = js
    root.appendChild(node)
    root.removeChild(node)
  }
  function compileScripts(fn, exopt) {
    var
      scripts = doc.querySelectorAll('script[type="riot/tag"]'),
      scriptsAmount = scripts.length
    function done() {
      promise.trigger('ready')
      ready = true
      if (fn) fn()
    }
    function compileTag(src, opts, url) {
      globalEval(compile(src, opts, url))
      if (!--scriptsAmount) done()
    }
    if (!scriptsAmount) done()
    else {
      for (var i = 0; i < scripts.length; ++i) {
        var
          script = scripts[i],
          opts = {template: script.getAttribute('template')},
          url = script.getAttribute('src')
        if (exopt) opts = extend(opts, exopt)
        url ? GET(url, compileTag, opts) : compileTag(script.innerHTML, opts)
      }
    }
  }
  return function (arg, fn, opts) {
    if (typeof arg === 'string') {
      if (typeof fn === 'object') {
        opts = fn
        fn = false
      }
      if (/^\s*</.test(arg)) {
        var js = compile(arg, opts)
        if (!fn) globalEval(js)
        return js
      }
      GET(arg, function (str) {
        var js = compile(str, opts, arg)
        globalEval(js)
        if (fn) fn(js, str)
      })
    }
    else {
      if (typeof arg === 'function') {
        opts = fn
        fn = arg
      }
      else {
        opts = arg
        fn = undefined
      }
      if (ready)
        return fn && fn()
      if (promise) {
        if (fn) promise.on('ready', fn)
      } else {
        promise = riot.observable()
        compileScripts(fn, opts)
      }
    }
  }
})()
var mount = riot.mount
riot.mount = function(a, b, c) {
  var ret
  riot.compile(function() { ret = mount(a, b, c) })
  return ret
}
  /* istanbul ignore next */
  if (typeof exports === T_OBJECT)
    module.exports = riot
  else if (typeof define === 'function' && define.amd)
    define(function() { return (window.riot = riot) })
  else
    window.riot = riot
})(typeof window != 'undefined' ? window : void 0);
