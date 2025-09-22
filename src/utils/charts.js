import jsPDF from "jspdf";
import { getInstanceByDom } from 'echarts/core';
import { $success, $error } from "./notify";
export default {
  // 柱图显示样式
  barWidth: 25,
  colors: [
    '#0BC6C9', '#2D78FF', '#FF6D65',
    '#FEC541', '#73D13E', '#6D5EFC',
    '#1248A9', '#0F6365', '#3F33AA'
  ],
  barItemStyle: {
    color: {
      type: 'linear',
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: '#C2D1FF' },
        { offset: 1, color: '#708AFF' }
      ]
    }
  },
  // 饼图生成数据
  generateData(data, key) {
    // 饼图颜色数组
    const colors = this.colors;
    const arr = data[key] || data;
    // 删除最后一个元素
    arr.length > 6 && arr.pop()
    return arr.map((item, index) => ({
      value: item.count,
      name: (item.level_type) ? (['一', '二', '三', '四'][item.level_type - 1] + '级') : (item.user || item.user_category)?.substring(0, 5) || '总数',
      itemStyle: { color: colors[index] }
    }))
  },
  // 饼图计算总数
  calcTotal(o) {
    const option = o.value || o;
    const data = option.series[0]?.data || [];
    const total = data.reduce((acc, cur) => acc + cur.value, 0)
    // console.log('总数', option.value.title)
    option.title.total = total;
    return total;
  },
  // 柱图提取日期
  extractDate(data) {
    // 日期截取后面五位
    return data.map((item) => (item.stats.slice(-5).replace(/-/g, '.')))
  },
  // 柱图提取数据
  extractData: (data, isPop = true) => {
    isPop && data.length > 7 && data.pop()
    return data.map((item) => (item.count))
  },
  // 柱图用户名称
  extractName: (data, desc) => {
    data.length > 7 && data.pop()
    return data.map((item) => (item[desc] || item.user_category).substring(0, 5))
  },
  // 日期格式化
  formatDate: (dateStr, isFull) => {
    const regx = isFull ? "$1年$2月$3日" : "$2月$3日"
    return dateStr.replace(/(\d{4})[-/](\d{2})[-/](\d{2})/, regx);
  },
  // 鼠标悬停事件
  handleMouseOver(e, o) {
    // 隐藏标题
    // e.title.show = false;
    o.title.subtext = e.name;
    o.title.text = e.value;
  },
  // 鼠标离开事件
  handleMouseOut(o) {
    // 显示标题
    // e.title.show = true;
    o.title.subtext = '总数';
    o.title.text = o.title.total;
  },
  // 图表高亮事件
  handleHighlight(e, o) {
    // e.title.show = false;
    // console.log('高亮事件', e, o);
    o.title.subtext = e.name;
    o.title.text = o.series[0].data.find(item => item.name === e.name).value;
  },
  handleDownplay(o) {
    // e.title.show = false;
    // console.log('高亮取消', o);
    this.handleMouseOut(o);
  },
  // 图例选择变化
  handleLegendselectchanged(e, option) {
    console.log('图例选择变化', e);
    const selected = e.selected;
    const series = option.series[0].data;
    // console.log('series:', series);

    // 重新计算总数
    let total = 0;
    Object.keys(selected).forEach(legendName => {
      // console.log('legendName:', legendName)
      if (selected[legendName]) { // 只计算选中的图例
        const seriesData = series.find(s => s.name === legendName).value;
        // console.log('seriesData:', seriesData)
        total += seriesData;
      }
    });

    // console.log('新的总数:', total);
    option.title.total = total;
  },
  updateParOption(o, data, cols) {
    const field = cols ? 'type_id' : 'device_id'
    const parOption = o?.parOption
    const device = cols || parOption.xAxis.device
    if (data && data.length > 0) {
      const uniq = (a, k) => [...new Set(a.map(o => o[k].slice(-5).replace(/-/g, '.')))]
      parOption.xAxis.data = uniq(data, 'stats')
      const arr = {}, series = []
      data.forEach(item => {
        const device_id = item[field]
        if (!arr[device_id]) {
          arr[device_id] = data.filter(it => it[field] === device_id)
          series.push({
            name: device?.find(d => d[cols ? 'id' : 'value'].toString() === device_id)?.[cols ? 'type_name' : 'label'] || device_id,
            type: 'bar',
            stack: 'total',
            barWidth: this.barWidth,
            data: arr[device_id].map((it) => (it.count))
          })
          parOption.xAxis.data
        }
      })
      parOption.series = series
    }
  },
  updateBarOption(o, data, isDevice = false, isHour = false) {
    if (!data || data.length === 0) return
    const barOption = o?.barOption
    if (isDevice) {
      console.log('barOption.xAxis.device', barOption.xAxis.device, data)
      barOption.xAxis.data = data.map(v => barOption.xAxis.device?.find(d => d.value.toString() === v.stats)?.label || v.stats);
      console.log('barOption.xAxis.data', barOption.xAxis.data)
    } else if (isHour) {
      barOption.xAxis.data = data.map(item => item.stats + ':00')
    } else {
      barOption.xAxis.data = data.map(item => item.user_category || item.stats?.slice(-5).replace(/-/g, '.') || item.position) //charts.extractDate(data)
    }
    barOption.series[0].data = this.extractData(data, false)
  },
  updatePieOption(o, data, isTop = true) {
    const pieOption = o?.pieOption
    if (data && data.length > 0) {
      // console.log('pieOption:', pieOption);
      if (isTop) {
        pieOption.legend.top = 'center'
        pieOption.legend.left = 200
      }
      pieOption.series[0].data = this.generateData(data)
      pieOption.title.text = this.calcTotal(pieOption)
    }
  },
  textToImage(text, width = text.length * 100, height = 200) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    // 白色背景
    // ctx.fillStyle = '#fff';
    // ctx.fillRect(0, 0, width, height);

    // 黑色文字，32px，微软雅黑字体
    ctx.font = '28px "Microsoft YaHei", Arial, sans-serif';
    ctx.fillStyle = '#202332';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 居中显示文字
    ctx.fillText(text, width / 2, 50);

    const imageData = canvas.toDataURL('image/png');
    canvas.remove();

    return imageData;
  },
  exportChartsToPDF(name) {
    // 初始化PDF文档
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(10);
    pdf.setTextColor(105, 105, 105);
    const pageWidth = pdf.internal.pageSize.getWidth();
    // const pageHeight = pdf.internal.pageSize.getHeight();
    // 添加文档标题
    pdf.addImage(this.textToImage(name), 'PNG', pageWidth / 4, 10, pageWidth / 2, 40);
    // 添加日期和时间
    pdf.addImage(this.textToImage(new Date().toLocaleString()), 0, 25, pageWidth, 30);
    // 获取所有ECharts实例
    const charts = document.querySelectorAll('.si-chart');
    const slen = charts.length
    if (slen === 0) return $error('暂无图表数据');
    // console.log('charts:', charts);
    // 遍历所有图表

    for (let i = 0; i < slen; i++) {
      pdf.text(`- ${i + 1} -`, 200, 290, { align: 'right' });
      const chart = charts[i].querySelectorAll('.echarts');
      const title = charts[i].querySelectorAll('.text-center');
      const clen = chart.length
      for (let j = clen - 1; j >= 0; j--) {
        const ch = chart[j];
        const tt = title[j].textContent;
        const c = getInstanceByDom(ch);
        // console.log('ch:', c, tt.textContent);
        // 1. 处理标题
        const textData = this.textToImage(tt);
        // 2. 处理图表
        // 获取高质量图表图像(2倍分辨率)
        const imgData = c.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: 'transparent'
        });
        // 计算图片尺寸(保留10mm边距)
        const imgWidth = pageWidth / (clen > 2 ? 2 : clen) - 10 // - clen * 10;
        const imgHeight = (ch.offsetHeight * imgWidth) / ch.offsetWidth;
        // 添加图片到PDF(居中显示)
        let xPos = j * imgWidth + j * 10 + 5; //(pageWidth - imgWidth) / 2;
        // console.log('xPos:', xPos, imgWidth, imgHeight);
        let scale = 1, left = 0, yPos = 10;
        if (i == 0) {
          yPos += 50;
          // 按比例高度缩放到39mm
          scale = 50 / imgHeight;
          left = (j == 0) ? 26 : 23;
          if (j > 1) {
            xPos = (j - 2) * imgWidth + (j - 2) * 10 + 5
            yPos += imgHeight * scale + 20;
          }
        } else if (i == 1) {
          const date = c.getOption().date;
          const dstr = this.formatDate(date.from, true) + ' - ' + this.formatDate(date.to);
          pdf.addImage(this.textToImage(dstr), 'PNG', 0, 25, pageWidth, 30)
          pdf.addImage(imgData, 'PNG', xPos + imgWidth / 4 + 10, -10, imgWidth / 2, imgHeight / 2);
          pdf.addImage(textData, 'PNG', xPos, 15, imgWidth, 30);
          continue;
        } else {
          // 增加类型、日期
          const date = c.getOption().date;
          console.log('date=', date)
          const type = date?.range_type;
          let dstr = '';
          if (type && i != 4 && i != 7) {
            dstr = '类型：' + (type == 'date' ? '日' : type == 'week' ? '周' : '月') + '    ';
          }
          dstr += '截至：' + date?.end_time;
          pdf.addImage(this.textToImage(dstr), 'PNG', -pageWidth / 2, 25, pageWidth * 2, pageWidth * 4 / dstr.length)
        }
        pdf.addImage(textData, 'PNG', xPos, yPos, imgWidth, 30);
        pdf.addImage(imgData, 'PNG', xPos + left, yPos + 20, imgWidth * scale, imgHeight * scale);
      }
      // 添加新页(最后一个图表除外)
      (i < slen - 1) && pdf.addPage();
    }
    // 保存PDF
    const fileName = name + '-' + new Date().toLocaleString().replace(' ', '-') + '.pdf'
    pdf.save(fileName, { returnPromise: true }).then(() => $success('图表已导出到PDF' + fileName));
  }
}
