import { inject, onBeforeUnmount } from 'vue'

export function useEventBus() {
  const bus = inject('bus')
  const listeners = []

  // 发送事件
  const send = (eventName, payload) => {
    bus.emit(eventName, payload)
  }

  // 监听事件
  const on = (eventName, callback) => {
    bus.on(eventName, callback)
    listeners.push({ eventName, callback })
    // console.log('add eventBus -- on', eventName, callback)
  }

  // 移除监听
  const off = (eventName, callback) => {
    bus.off(eventName, callback)
    listeners.filter(item => !(item.eventName === eventName && item.callback === callback))
  }

  // 自动清理
  onBeforeUnmount(() => {
    listeners.forEach(({ eventName, callback }) => {
      // console.log('clean eventBus -- off', eventName, callback)
      bus.off(eventName, callback)
    })
  })

  return {
    send,
    on,
    off
  }
}
