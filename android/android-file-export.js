(() => {
  const portReady = new Promise(resolve => {
    function attach(event) {
      if (event.data !== 'lingshe:native-file-export' || event.ports.length !== 1) return
      window.removeEventListener('message', attach)
      resolve(event.ports[0])
    }
    window.addEventListener('message', attach)
  })

  function capture(anchor) {
    if (!anchor.download || !anchor.href.startsWith(`blob:${location.origin}/`)) return false
    const name = anchor.download
    fetch(anchor.href).then(response => response.blob()).then(async blob => {
      const reader = new FileReader()
      const port = await portReady
      reader.addEventListener('load', () => {
        const mime = blob.type.split(';', 1)[0] || 'application/octet-stream'
        port.postMessage(JSON.stringify({name, mime, base64: reader.result.split(',', 2)[1]}))
      }, {once: true})
      reader.readAsDataURL(blob)
    }).catch(() => window.alert('文件导出未完成，请重试。'))
    return true
  }

  const click = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () {
    if (!capture(this)) click.call(this)
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[download]')
    if (anchor && capture(anchor)) event.preventDefault()
  })
})()
