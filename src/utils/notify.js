import { Notify, Dialog } from 'quasar'

export const $success = (msg, callback) => {
  showMsg('positive', msg, callback)
}

export const $error = (msg) => {
  showMsg('negative', msg)
}

export const $info = (msg) => {
  showMsg('info', msg)
}

export const $warning = (msg) => {
  showMsg('warning', msg)
}

const showMsg = (type, msg, callback) => {
  if (!type || !msg) return
  Notify.create({
    type: type,
    message: msg,
    position: 'top',
    progress: true,
    timeout: 2000,
    actions: [
      { icon: 'close', color: 'white', round: true }
    ],
    onDismiss: () => {
      // console.log('Dismissed')
      callback && callback()
    }
  })
}

export const $dialog = (title, msg, callback) => {
  Dialog.create({
    title: title,
    message: msg,
    cancel: true,
    ok: { color: 'primary', flat: true },
    persistent: true,
    class: 'z-max',
    html: true
  }).onOk(() => {
    callback && callback()
  })
}
