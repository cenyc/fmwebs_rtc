<template>

  <!-- 搜索栏 -->
  <div class="search-container q-pa-md" v-if="searchable && searchFields.length">
    <SISearch :fields="searchFields" :param="param" @fill-search="fillSearch" @search="fetchData" />
  </div>

  <div class="toolbtn-container">
    <!-- 工具栏 -->
    <div class="flex">
      <q-btn v-if="showBtn" label="新增" rounded unelevated color="primary" icon="add" @click="openFormDialog('add')" />
      <q-btn v-if="showBtn" label="刷新" rounded unelevated outline icon="refresh" class="q-ml-sm refresh-btn"
        @click="fetchData" />
      <div class="text-subtitle1" style="align-self:flex-end;padding-bottom:8px" v-else>{{ props.title
        }}</div>
      <slot name="tool-btn" />
      <q-space />
      <q-btn-group flat rounded>
        <q-btn label="导出" rounded unelevated icon="file_download" class="export-btn q-ml-sm"
          :disable="selected.length === 0" @click="exportData" />
        <!-- 显示/隐藏列 -->
        <q-btn color="primary" rounded dense unelevated icon="more_vert" @click="toggleColumnsDialog = true">
          <q-menu>
            <q-list style="min-width: 150px" dense>
              <!-- 头部 -->
              <q-item>
                <q-item-section>
                  <q-item-label>隐藏列</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item v-for="col in columns" :key="col.name">
                <q-item-section>
                  <q-checkbox v-model="col.hidden" :label="col.label" @update:model-value="handleHideColumns(col)" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-btn-group>
    </div>
  </div>
  <div class="smart-table-container">
    <!-- 数据表格 -->
    <q-table :rows="tableData" :columns="visibleColumns" row-key="id"
      :selection="tableData?.length ? 'multiple' : 'none'" v-model:selected="selected" :loading="loading"
      v-model:pagination="pagination" @request="onRequest" binary-state-sort separator="cell" flat
      :rows-per-page-options="[5, 10, 20, 100, 500]">
      <template #body-cell="props">
        <q-td :props="props" v-if="isTooLong(props)">
          {{ props.value.slice(0, 36) + '...' }}
          <q-tooltip class="bi-text-wrap">{{ props.value }}</q-tooltip>
        </q-td>
        <q-td :props="props" v-else>
          <div v-if="props.col.name.endsWith('_time') || props.col.name.endsWith('_at')">{{ formatDate(props.value) }}
          </div>
          <slot v-else name="body-cell" v-bind="props">
            {{ props.value }}
          </slot>
        </q-td>
      </template>
      <!-- 是否启用 -->
      <template #body-cell-enabled="props">
        <q-td :props="props">
          <q-toggle v-model="props.row.enabled" @update:modelValue="handleToggle($event, props.row)" />
          <q-tooltip>
            {{ props.row.enabled ? '启用✓' : '禁用✕' }}
          </q-tooltip>
          <!-- {{ props.row.enabled ? '✔️' : '❌' }} -->
        </q-td>
      </template>
      <template #body-cell-is_enabled="props">
        <q-td :props="props">
          {{ props.row.is_enabled ? '✔️' : '❌' }}
        </q-td>
      </template>
      <template #body-cell-status="props">
        <q-td :props="props">
          {{ ['❌', '✔️', '🚫'][props.row.status] || '❓' }}
          <q-tooltip>{{ ['❌ 未处理', '✔️ 已处理', '🚫 已忽略'][props.row.status] || '❓ 未知' }}</q-tooltip>
        </q-td>
      </template>
      <!-- 操作列 -->
      <template #body-cell-actions="props">
        <q-td :props="props" auto-width>
          <q-btn-group flat>
            <q-btn dense flat color="primary" :label="editBtnLabel" @click="openFormDialog('edit', props.row)"
              v-if="editable" />
            <q-btn dense flat color="negative" label="删除" @click="openFormDialog('delete', props.row)"
              v-if="deleteable" />
            <slot name="actions" :props="props"></slot>
          </q-btn-group>
        </q-td>
      </template>
    </q-table>

    <!-- 表单对话框 -->
    <SIDialog v-model="showFormDialog" :fields="formFields" :initial-data="currentItem" :mode="dialogMode"
      :custom-form="customForm" :title="dialogTitle" :delete-field="deleteField" :width="dialogWidth"
      :label-width="labelWidth" :default-span="defaultSpan" @submit="handleFormSubmit">
      <template #custom-form="{ props }">
        <slot name="custom-form" v-bind="{ props }"></slot>
      </template>
    </SIDialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from 'src/stores/config'
import { useUserStore } from 'src/stores/user'
import { $success } from 'src/utils/notify'
import { formatDate } from 'src/utils/tools'
import SIDialog from './SIDialog.vue'
import fields from '../utils/fields'
import apiLogin from '../api/data'
import apiMain from '../api/main'
import SISearch from './SISearch.vue'
import * as XLSX from 'xlsx'

const props = defineProps({
  // api接口路径
  svr: {
    type: String,
    default: 'login'
  },
  dir: {
    type: String,
    required: true
  },
  // 二级接口路径
  sub: {
    type: String,
    default: ''
  },
  param: {
    type: Object,
    default: () => (null)
  },
  showBtn: {
    type: Boolean,
    default: true
  },
  // 每页条数
  pageSize: {
    type: Number,
    default: 20
  },
  // 表格标题
  title: {
    type: String,
    default: ''
  },
  dialogWidth: {
    type: String,
    default: '300px'
  },
  labelWidth: {
    type: String,
    default: '70px'
  },
  // 编辑框字段
  formFields: {
    type: Array,
    default: () => []
  },
  // 默认字段布局
  defaultSpan: {
    type: Number,
    default: 0
  },
  //排除字段
  excludeInputs: {
    type: Array,
    default: () => []
  },
  excludeFields: {
    type: Array,
    default: () => []
  },
  // 是否可搜索
  searchable: {
    type: Boolean,
    default: true
  },
  // 是否有操作列
  actions: {
    type: Boolean,
    default: true
  },
  // 是否可编辑
  editable: {
    type: [Boolean, Number],
    default: true
  },
  // 编辑按钮别名
  editBtnLabel: {
    type: String,
    default: '编辑'
  },
  // 是否可删除
  deleteable: {
    type: Boolean,
    default: true
  },
  // 删除模式使用的字段
  deleteField: {
    type: String,
    default: 'name'
  },
  // 是否自定义表单
  customForm: {
    type: Boolean,
    default: false
  },
  // 自定义字段
  customFields: {
    type: Array,
    default: () => []
  },

})

const configStore = useConfigStore()
const userStore = useUserStore()
// const emit = defineEmits(['refresh'])
const api = props.svr === 'login' ? apiLogin : apiMain
// 表格数据状态
const tableData = ref([])
const columns = ref([])
const formFields = ref(props.formFields)
const searchFields = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, rowsPerPage: props.pageSize, rowsNumber: 0 })
const selected = ref([])
const searchParams = ref({ ...props.param })
// 表单对话框状态
const showFormDialog = ref(false)
const dialogMode = ref('add') // 'add' | 'edit'
const currentItem = ref({})

// 计算对话框标题
const dialogTitle = computed(() => {
  // return dialogMode.value === 'add' ? `新增${props.title || '记录'}` : `编辑${props.title || '记录'}`
  let title = ''
  switch (dialogMode.value) {
    case 'add':
      title = '新增'
      break;
    case 'edit':
      title = props.editBtnLabel
      break;
    case 'delete':
      title = '删除'
      break;
  }
  return `${title}${props.title || '记录'}`
})
// 计算可见列
const visibleColumns = computed(() =>
  columns.value.filter(col => !col.hidden)
)
// 初始化加载数据
onMounted(() => {
  fetchData()
})

// 获取表格数据
async function fetchData(isSearch) {
  loading.value = true
  api.dataList(props.dir, {
    page: pagination.value.page,
    page_size: pagination.value.rowsPerPage,
    ...searchParams.value
  }).then(res => {
    // console.log('columns', columns.value, 'formFields', formFields.value)
    if (res.data) {
      tableData.value = res.data
      pagination.value.rowsNumber = res.total
      if (!isSearch) formatColumns(res.columns)
    }
  })/*.catch(error => {
    // $error('加载数据失败: ' + error.message)
  })*/.finally(() => {
    loading.value = false
  })
}
const exportData = () => {
  console.log('导出数据', selected.value, visibleColumns.value)
  // 准备Excel数据
  const cols = visibleColumns.value.filter(col => col.field !== '')
  const excelData = [
    cols.map(col => col.label || col.field),
    ...selected.value.map(row => cols.map(col => row[col.field]))
  ]

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)
  XLSX.utils.book_append_sheet(wb, ws, props.title || 'Sheet1')

  // 导出文件
  XLSX.writeFile(wb, props.title + new Date().toLocaleString() + '.xlsx')
}
const handleHideColumns = (col) => {
  console.log('handleHideColumns', col)
  if (col.hidden) {
    // 保存到 configStore
    if (!configStore.columns[userStore.name]) {
      configStore.columns[userStore.name] = {}
    }
    if (!configStore.columns[userStore.name][props.title]) {
      configStore.columns[userStore.name][props.title] = []
    }
    if (!configStore.columns[userStore.name][props.title].includes(col.field)) {
      configStore.columns[userStore.name][props.title].push(col.field)
    }
  } else {
    // 从 configStore 删除
    if (configStore.columns[userStore.name] && configStore.columns[userStore.name][props.title]) {
      const index = configStore.columns[userStore.name][props.title].indexOf(col.field)
      if (index !== -1) {
        configStore.columns[userStore.name][props.title].splice(index, 1)
      }
    }
    // 如果没有隐藏的列，则清空
    if (configStore.columns[userStore.name][props.title].length === 0) {
      delete configStore.columns[userStore.name][props.title]
    }
    if (Object.keys(configStore.columns[userStore.name]).length === 0) {
      delete configStore.columns[userStore.name]
    }
  }
}
// 处理表单验证
function getRules(col) {
  // if (dialogMode.value === 'search') {
  //   return []
  // } else {
  if (col.is_required) {
    return [val => !!val || (col.cname + '不能为空')]
  }
  if (col.max_length) {
    return [val => val.length <= col.max_length || `最多${col.max_length}个字符`]
  }
  return []
  // }
}
// 格式化表格列
function formatColumns(columns_data) {
  const colset = [], fieldset = [], findset = []
  // 如果不存在列对象，从第一条数据中获取字段
  if (!columns_data) {
    if (tableData.value?.length === 0) return
    columns_data = []
    const firstRow = tableData.value?.[0] || {}
    console.log('firstRow', firstRow)
    for (const key in firstRow) {
      // 根据第一列数据取列名
      columns_data.push({ name: key, cname: key, is_visible: true })
    }
  }
  const defaultSpan = columns_data.filter(item => item.is_editable === true).length > 6 ? 6 : 12
  columns_data?.forEach(col => {
    // if (col.cname === '') col.cname = col.name

    // 获得自定义字段名
    const customField = fields.getCustomField(col.name)
    // customField 不为空
    if (customField && !props.excludeInputs.includes(customField.type)) {
      // 自定义字段集不存在则添加
      const fieldItemNotExist = !fieldset.some(f => f.name === customField.type)
      const findItemNotExist = !findset.some(f => f.name === customField.type)
      if (fieldItemNotExist || findItemNotExist) {
        // 排除字段
        customField.fields = customField.fields.filter(f => !props.excludeFields.includes(f))
        const fieldItem = {
          name: customField.type,
          label: customField.label,
          type: customField.type,
          fields: customField.fields,
          extra: customField.extra,
          rules: col.rules || getRules(col),
          span: customField.span || defaultSpan,
          required: col.is_required,
        }
        if (col.is_editable && fieldItemNotExist) {
          fieldset.push(fieldItem)
        }
        if (col.is_searchable && findItemNotExist) {
          findset.push(fieldItem)
        }
      }
    } else {
      const formType = fields.toFormType(col.name)
      const fieldItem = {
        name: col.name,
        label: col.cname || col.name,
        type: col.type || formType.type,
        rules: col.rules || getRules(col),
        span: col.span || formType.span || defaultSpan,
        required: col.is_required,
      }
      if (col.is_editable) {
        fieldset.push(fieldItem)
      }
      if (col.is_searchable) {
        findset.push(fieldItem)
      }
    }
    if (col.is_visible)
      colset.push({
        name: col.name,
        label: col.cname || col.name,
        align: col.align || 'center',
        field: col.field || col.name,
        sortable: false,
        hidden: false,
      })
  })
  // 处理自定义字段
  if (props.customFields.length > 0) {
    props.customFields.forEach(field => {
      const fieldItem = {
        name: field,
        label: field,
        default: []
      }
      fieldset.push(fieldItem)
    })
  }
  // 添加操作列
  const showAction = props.showBtn || props.actions //props.deleteable || props.editable
  showAction && colset.push({
    name: 'actions',
    label: '操作',
    field: '',
    align: 'center',
    hidden: false
  })
  // 处理隐藏列
  if (configStore.columns[userStore.name] && configStore.columns[userStore.name][props.title]) {
    const hiddenFields = configStore.columns[userStore.name][props.title]
    console.log('hiddenFields', hiddenFields, colset)
    hiddenFields.forEach(field => {
      const col = colset.find(c => c.field === field)
      if (col) col.hidden = true
    })
  }
  columns.value = colset
  if (formFields.value.length > 0) {
    console.log('formFields1', formFields.value, fieldset)
    // formFields中的字段，按name从fieldset中筛选，保证顺序一致
    formFields.value = formFields.value.map(item => fieldset.find(it => it.name === item))
    console.log('formFields2', formFields.value)
  } else
    formFields.value = fieldset
  searchFields.value = findset
  // console.log('searchFields', searchFields.value, formFields.value, columns.value)
}
// 处理开关
const handleToggle = (val, row) => {
  console.log('handleToggle', val, row.id)
  // 远程更新状态
  api.dataUpdate(props.dir, {
    id: row.id,
    enabled: val
  }).then(() => {
    $success('更新成功')
  }).catch(() => {
    // 恢复状态
    row.enabled = !val
  })
}

// 字段长度处理
const isTooLong = (attr) => {
  const tl = !attr.col.name.includes('image_url') || !props.title.includes('轨迹')
  const str = attr.value
  return tl && str && typeof str === 'string' && str.length > 36
}
// 分页/排序请求
function onRequest(props) {
  pagination.value = props.pagination
  fetchData()
}
// 处理搜索
function fillSearch(params) {
  pagination.value = { page: 1, rowsPerPage: pagination.value.rowsPerPage }
  // searchParams.value = { ...searchParams.value, ...params }
  if (params === null) {
    searchParams.value = {}
    return fetchData(true)
  }
  for (const key in params) {
    if (params[key] === '' || params[key] === null) {
      delete searchParams.value[key]
      continue
    }
    searchParams.value[key] = params[key]
  }
  console.log('当前搜索条件', searchParams.value)
  // fetchData(true)
}
// 打开表单对话框
function openFormDialog(mode, row = null) {
  dialogMode.value = mode
  currentItem.value = mode === 'add' ? createNewItem() : { ...row }
  showFormDialog.value = true
}

// 创建新条目默认值
function createNewItem() {
  const item = {}
  formFields.value.forEach(field => {
    const customField = fields.toFormType(field.name, true)
    if (customField) {
      item[field.name] = customField.default !== undefined ? customField.default : ''
    } else {
      customField !== null && (item[field.name] = field.default !== undefined ? field.default : '')
    }
  })
  console.log('createNewItem', item)
  return item
}

// 处理表单提交
function handleFormSubmit({ data, mode }) {
  const isAdd = mode === 'add'
  const apiFn = isAdd ? api.dataNew : api.dataUpdate

  apiFn(props.dir, data).then(() => {
    const handleResult = () => {
      $success(`${isAdd ? '新增' : (mode === 'edit' ? '更新' : '删除')}成功`)
      fetchData()
      showFormDialog.value = false
    }
    if (props.sub) {
      apiFn(props.sub, data).then(() => {
        handleResult()
      })
    } else {
      handleResult()
    }
  }) /*.catch(error => {
    $error(`${isAdd ? '新增' : '更新'}失败: ${error.message}`)
  }) */
}

// 暴露方法
defineExpose({
  fetchData,
})
</script>

<style lang="scss" scoped>
.search-container,
.smart-table-container {
  /* padding: 16px; */
  background: var(--q-white-bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
}

.q-btn--rounded {
  margin-top: 10px;
  margin-bottom: 10px
}

.refresh-btn {
  color: $active-color ;
}

:deep(th:last-child),
td:last-child {
  position: sticky;
  right: 0;
  z-index: 1;
  background: var(--q-white-bg-color);
}

:deep(.text-grey-8) {
  color: var(--q-primary) !important;
}
</style>
