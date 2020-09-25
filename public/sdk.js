// eslint-disable-next-line no-unused-vars
class MonitorSDK {
  constructor () {
    this.MAXTOSERVER = 10
    this.storageName = 'MonitorSdk:data'
    this.storageDelayName = 'MonitorDdk:delayData'
    this.debounce = null
    this.storageData = JSON.parse(
      window.localStorage.getItem(this.storageName) || '[]'
    )
    this.storageDelayData = JSON.parse(
      window.localStorage.getItem(this.storageDelayName) || '[]'
    )
    this.errorCatch()
    this.promiseCatch()
    this.historyRouterCatch()
    this.ajaxCatch()
    this.fetchCatch()
    this.behaviorCatch()
    this.agentCatch()
  }

  /**
   * 用户浏览器信息获取
   */
  agentCatch () {
    console.log(window.navigator.userAgent)
  }

  /**
   * 静态方法，2.2.0版本Vue起，Vue自带错误处理机制，并且不会冒泡到上层
   * 须将Vue实例传入，重写Vue内部错误处理
   * @param {Vue实例} Vue
   */
  static vueErrorCatch (Vue) {
    Vue.config.errorHandler = function (err, vm, info) {
      console.log(err, vm, info)
    }
  }

  /**
   * 全局异常处理
   */
  errorCatch () {
    window.addEventListener(
      'error',
      (msg, url, row, col, error) => {
        console.log(msg, url, row, col, error)
        this.handleData({ type: 'error' })
        return true
      },
      true
    )
  }

  /**
   * promise异常处理
   */
  promiseCatch () {
    window.addEventListener('unhandledrejection', event => {
      event.preventDefault()
      this.handleData({ type: 'promiseError' })
      console.log(event)
      return true
    })
  }

  /**
   * history路由监听
   */
  historyRouterCatch () {
    // 重写pushState和replaceState，注册事件
    function rewriteRouter (type) {
      // historyRouter
      const _history = history[type]
      return function () {
        // 创建同名事件
        const event = new Event(type)
        // 事件抛出参数
        event.arguments = arguments
        // 执行事件
        window.dispatchEvent(event)
        // 返回history
        return _history.apply(this, arguments)
      }
    }
    history.pushState = rewriteRouter('pushState')
    history.replaceState = rewriteRouter('replaceState')

    window.addEventListener('replaceState', event => {
      console.log(event)
    })
    window.addEventListener('pushState', event => {
      console.log(event)
      this.handleData({ type: 'routerChagne' })
    })
  }

  /**
   * hash路由监听
   */
  hashRouterCatch () {
    window.addEventListener('hashchange', function (event) {
      console.log(event)
    })
  }

  /**
   * hackXMLHttpRequest, 全局捕获XMLHttpRequest异常
   */
  ajaxCatch () {
    const _this = this
    // 判定XHR是否存在
    if (typeof window.XMLHttpRequest === 'function') {
      // 重写XHR
      const _open = window.XMLHttpRequest.prototype.open
      const _send = window.XMLHttpRequest.prototype.send
      window.XMLHttpRequest.prototype.open = function () {
        console.log('request open')
        return _open.apply(this, arguments)
      }
      window.XMLHttpRequest.prototype.send = function () {
        console.log('request send')
        // 当存在onreadystatechange方法时重写方法,防止被其他封装如:axios内部重写
        if (this.onreadystatechange) {
          const _onreadystatechange = this.onreadystatechange
          this.onreadystatechange = function () {
            // 请求结束
            if (this.readyState === 4) {
              _this.handleData({ type: 'requestSuccess' })
              console.log('request complete')
            }
            return _onreadystatechange.apply(this, arguments)
          }
        }
        return _send.apply(this, arguments)
      }
    }
  }

  /**
   * hackFetch, 全局捕获fetch异常
   */
  fetchCatch () {
    if (typeof window.fetch === 'function') {
      const _fetch = window.fetch
      window.fetch = function () {
        return _fetch
          .apply(window, Array.apply(null, arguments))
          .then(function (event) {
            const response = event.clone()
            const headers = response.headers
            if (headers && typeof headers.get === 'function') {
              var ct = headers.get('content-type')
              if (ct && !/(text)|(json)/.test(ct)) return event
            }
            response.text().then(function (res) {
              if (response.ok) {
                console.log(res, 'success')
              } else {
                console.log(res, 'error')
              }
            })
            return event
          })
      }
    }
  }

  /**
   * 用户行为监控，目前包括点击行为
   */
  behaviorCatch () {
    window.addEventListener('click', event => {
      if (event.target.tagName !== 'HTML' && event.target.tagName !== 'body') {
        this.handleData({
          type: 'click'
        })
        console.log(event)
      }
    })
  }

  /**
   * 数据处理，暂未想好该怎么写
   */
  handleData (data) {
    let storageTempData = []
    window.clearTimeout(this.debounce)
    this.storageData.push(data)
    window.localStorage.setItem(
      this.storageName,
      JSON.stringify(this.storageData)
    )
    this.debounce = window.setTimeout(() => {
      // 如果存在超过10条的未上传的缓存
      if (this.storageDelayData.length >= this.MAXTOSERVER) {
        storageTempData = this.storageData.splice(-1, this.MAXTOSERVER)
        window.localStorage.setItem(
          this.storageDelayName,
          JSON.stringify(this.storageDelayData)
        )
        // 如果存在用户行为缓存
      } else if (this.storageData.length >= this.MAXTOSERVER) {
        storageTempData = this.storageData.splice(-1, this.MAXTOSERVER)
        window.localStorage.setItem(
          this.storageName,
          JSON.stringify(this.storageData)
        )
      }
      if (storageTempData.length >= this.MAXTOSERVER) {
        console.log('上传监控数据')
        const error = false
        // 防止异常断网，重传机制
        if (!error) {
        } else {
          this.storageDelayData = this.storageDelayData.concat(storageTempData)
          window.localStorage.setItem(
            this.storageDelayName,
            this.storageDelayData
          )
        }
      }
      console.log(this.storageName)
      // window.localStorage.setItem(this.localStorage)
    }, 5000)
  }
}

// eslint-disable-next-line no-new
new MonitorSDK()
