import { date, copyToClipboard } from 'quasar'
import { $error, $success } from './notify'

// 时间格式化
export const formatDate = (iso_str, format) => {
  return date.formatDate(iso_str, format || 'YYYY-MM-DD HH:mm:ss')
  // return isoString.replace(/T/, ' ').replace(/Z/, '')
}
export const dateTimeRange = ({ from, to }) => {
  const today = new Date()
  const isBeforeToday = !date.isSameDate(to, today, 'date')
  console.log('isBeforeToday', isBeforeToday)
  to = isBeforeToday ? to + ' 23:59:59' : today
  return {
    start_time: formatDate(from, 'YYYY-MM-DD 00:00:00'),
    end_time: formatDate(to)
  }
}
export const last7Days = () => {
  let to = new Date() //- 1000 * 60 * 60 * 24
  let from = date.subtractFromDate(to, { days: 6 })
  from = formatDate(from, 'YYYY/MM/DD')
  to = formatDate(to, 'YYYY/MM/DD')
  return { from, to }
}
// 最近的一周，把其中每天放到一个数组里
export const make7Days = () => {
  let arr = []
  for (let i = 6; i >= 0; i--) {
    let d = date.subtractFromDate(new Date(), { days: i })
    arr.push(formatDate(d, 'MM.DD'))
  }
  return arr
}
// 返回当前时间
export const now = () => {
  return formatDate(new Date(), 'YYYY/MM/DD HH:mm:ss')
}
export const copy2Clipboard = async (text) => {
  try {
    await copyToClipboard(text)
    $success('复制成功')
  } catch (err) {
    $error('复制失败:' + err.message || err)
  }
}
