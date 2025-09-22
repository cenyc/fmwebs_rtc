<!-- 功能号选择器 -->
<template>
  <q-select v-if="isSearchMode" :class="{ showed }" dense borderless transition-hide :use-chips="!isSearchMode"
    :clearable="isSearchMode" clear-icon="close" use-input options-dense v-model="selectedItems" :options="[null]"
    :rules="getRules()" label="功能号" popup-content-class="br10" @update:model-value="onSelectedClear"
    @filter="filterTreeData" @popup-hide="showed = false" @popup-show="showed = true">
    <template #option>
      <!-- <q-tree v-if="!isSearchMode && treeNode.length > 0" :nodes="treeNode" node-key="id" label-key="description"
        v-model:ticked="selectedItems" v-model:expanded="expandedNode" tick-strategy="leaf"
        @update:ticked="onSelectedChange" /> -->
      <q-tree v-if="treeNode.length > 0" :nodes="treeNode" node-key="id" label-key="description"
        v-model:selected="selectedItems" v-model:expanded="expandedNode" @update:selected="onSelectedChange" />
      <div v-else class="q-pa-md">没有数据</div>
    </template>
  </q-select>
  <div v-else style="position: relative;left:-115px;right:-80px;width:100%;">
    <div class="text-subtitle1 q-mt-md">权限组设置</div>
    <q-markup-table flat bordered style="width:834px">
      <thead>
        <tr>
          <th align="left">一级</th>
          <th align="left">二级</th>
          <th>管理员访问权限</th>
          <th>工作人员访问权限</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in treeData" :key="item.id">
          <td>{{ item.description }}</td>
          <td>
            <div v-for="ch in item.children" :key="ch.id">
              {{ ch.description }}
            </div>
          </td>
          <td align="center">
            <div v-for="ch in item.children" :key="ch.id">
              <q-checkbox size="xs" v-model="selectedItems" :disable="originalItems.includes(ch.id)" :val="ch.id"
                @update:model-value="onSelectedChange" />
            </div>
          </td>
          <td align="center">
            <div v-for="ch in item.children" :key="ch.id">
              <q-checkbox size="xs" v-model="selectedItems" disable :val="ch.id" />
            </div>
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useEventBus } from 'src/utils/event'
import api from 'src/api/data'
const { on } = useEventBus()

const treeData = ref([])
const treeNode = ref([])
const props = defineProps({
  modelValue: Object,
  mode: String
})
const isSearchMode = props.mode === 'search';
const showed = ref(false)
const selectedItems = isSearchMode ? computed({
  get: () => props.modelValue ? props.modelValue.btn_id : [],
  set: (value) => {
    emit('update:modelValue', { btn_id: value })
  }
}) : ref([])
const originalItems = ref([])
!isSearchMode && on('role->btnid', (payload) => {
  console.log('功能号选择器 role->btnid：', payload)
  selectedItems.value = payload
  originalItems.value = [...payload]
})

const expandedNode = ref([])
const emit = defineEmits(['update:modelValue', 'fillFields'])
console.log('功能号选择器：', props.modelValue)
const getRules = () => {
  if (isSearchMode) return []
  return [() => selectedItems.value.length || '功能号不能为空']
}
// 数据初始化
if (props.modelValue && props.modelValue.btn_id !== '') {
  selectedItems.value = [props.modelValue?.btn_id]
}
// 加载树形数据
const loadTreeData = async () => {
  api.dataList('menu/customer', {
    page: 1,
    page_size: 10
  }).then(res => {
    treeData.value = formatData(res.data);
    console.log('功能列表数据：', res)
  }).catch(err => {
    console.log('功能列表数据错误：', err)
  })
}
function filterTreeNodes(nodes, predicate) {
  return nodes
    .map(node => ({ ...node })) // 浅拷贝节点
    .filter(node => {
      // 检查当前节点是否匹配
      const isMatched = predicate(node)
      if (isMatched) {
        expandedNode.value = [...expandedNode.value, node.id]
        return true;
      }
      // 如果有子节点，递归筛选
      if (node.children) {
        node.children = filterTreeNodes(node.children, predicate)

        // 保留当前节点如果它本身匹配或子节点有匹配
        if (node.children.length > 0) {
          expandedNode.value = [...expandedNode.value, node.id]
          return true;
        }
      }

      return isMatched
    })
}
// 过滤树形数据
const filterTreeData = (val, update) => {
  expandedNode.value = []
  console.log('过滤数据：', val, treeData.value)
  update(() => {
    if (val === '') {
      treeNode.value = treeData.value;
      return
    }
    treeNode.value = filterTreeNodes(treeData.value, item => item.description.includes(val) || item.id == val);
  })
}
// 格式化数据
const formatData = (data) => {
  const level_1 = data.filter(item => item.level == '1')
  const level_2 = data.filter(item => item.level == '2')
  // 自动归类
  level_1.forEach(item => {
    const children = level_2.filter(child => child.leader_id == item.menu_number)
    if (children.length > 0) {
      item.children = children
    }
  })
  return level_1
}
const onSelectedChange = (val) => {
  console.log('选中数据：', val)
  if (isSearchMode) {
    emit('fillFields', { btn_id: val })
    return;
  }
  // 从 val 中 移除 originalItems 中的元素
  if (!isSearchMode) val = val.filter(item => !originalItems.value.includes(item))
  console.log('原始数据：', originalItems.value, '预提交数据：', val)
  emit('update:modelValue', { btn_id_list: val })
}
const onSelectedClear = () => {
  if (isSearchMode) {
    emit('fillFields', { btn_id: '' })
  }
}
loadTreeData()
console.log(props.modelValue, emit)
</script>
<style scoped>
.q-table th,
.q-table td {
  line-height: 30px;
}
</style>
