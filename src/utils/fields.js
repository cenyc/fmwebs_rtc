export default {
  // 不是系统字段
  isExcludeField: (field, mode = 'add') => {
    const excludeFelds = {
      add: [
        // 'id',
        'enabled_input',
        // 'creator', 'create_time', 'created_time', 'created_at',
        // 'updated_at', 'update_time', 'delete_flag'
      ],
      edit: [
        'password',
      ]
    }
    return excludeFelds[mode].includes(field)
  },
  // 是自定义字段
  getCustomField: (field) => {
    // 字段映射表，可根据实际需求进行扩展
    const fieldMap = [
      { type: 'addr_input', label: '地址', fields: ['province', 'city', 'area', 'street'], span: 12 },
      { type: 'addr-id_input', label: '省市ID', fields: ['province_code', 'city_code', 'area_code', 'street_code'], span: 12 },
      { type: 'btn-id_input', label: '功能号', fields: ['btn_id'], span: 12 },
      { type: 'role_input', label: '角色名称', fields: ['role_name'], span: 12 },
      { type: 'limit_input', label: '权限组名', fields: ['limits_id', 'limits_name'], span: 12 },
      { type: 'creator_input', label: '操作人', fields: ['creator'], span: 12 },
      { type: 'create-time_input', label: '时间', fields: ['create_time'], span: 12 },
      { type: 'create-time_input', label: '时间', fields: ['created_at'], span: 12 },
      { type: 'create-time_input', label: '时间', fields: ['created_time'], span: 12 },
      { type: 'create-time_input', label: '抓拍时间', fields: ['capture_time'], span: 12 },
      { type: 'is-manager_input', label: '用户类型', fields: ['ismanager'], span: 6 },
      { type: 'is-system_input', label: '系统账号', fields: ['isystem'], span: 6 },
      { type: 'tenant-id_input', label: '所属租户', fields: ['tenant_id'] },
      { type: 'dept_input', label: '部门', fields: ['department'], span: 6 },
      { type: 'gender_input', label: '性别', fields: ['gender'], span: 6 },
      { type: 'type-id_input', label: '人员类型', fields: ['type_id'], extra: { label: 'type_name', value: 'type_id', dir: '/type' }, span: 6 },
      { type: 'profile-id_input', label: '人员ID', fields: ['matched_profile_id'], extra: { label: 'name', value: 'id', dir: '' }, span: 6 },
      { type: 'func-type_input', label: '相机分组', fields: ['func_type'], extra: ['采集', '抓拍', '人工'], span: 6 },
      { type: 'status_input', label: '处理状态', fields: ['status'], extra: ['未处理', '已处理', '已忽略'], span: 6 },
      { type: 'enabled_input', label: '状态', fields: ['enabled'], extra: ['已禁用', '已启用'], span: 6 },
      { type: 'leader-flag_input', label: '用户权限', fields: ['leader_flag'], extra: [{ label: '工作人员', value: '1' }, { label: '管理员', value: '3' }], span: 12 },
    ]
    // 遍历字段映射表，检查当前字段是否在某个自定义字段列表中
    for (let index in fieldMap) {
      const f = fieldMap[index]
      if (f.fields.includes(field)) {
        return f;
      }
    }
    return null;
  },
  // 是自定义类型
  isCustomType: (type) => {
    return !['text', 'number', 'select', 'date', 'textarea', 'file', 'toggle'].includes(type)
  },
  // fieldName 与表单类型映射函数
  toFormType(fieldName, isAdd = false) {
    switch (fieldName) {
      case 'id':
      case 'limit_id':
        return { type: 'number', default: 0 }
      case 'enabled':
        return isAdd ? null : { type: 'toggle', default: true, span: 6 }
      case 'isystem':
        return { type: 'toggle', default: '0', span: 6 }
      case 'deleted_at':
        return { type: 'datetime', default: '', span: 6 }
      // case 'area':
      //   return 'area'
      // case 'street':
      //   return 'street'
      default:
        return 'text'
    }
  }
}
