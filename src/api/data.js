import { login_server as api } from "src/boot/axios";

export default {
  // 数据GET
  dataGet(catdir, parameter) {
    return api.get(`/${catdir}`, parameter)
  },
  // 数据POST
  dataPost(catdir, parameter) {
    return api.post(`/${catdir}`, parameter)
  },
  // 数据删除
  dataDelete(catdir, id) {
    return api.post(`/${catdir}/update`, { id, 'delete_flag': '1' })
  },
  // 数据列表
  dataList(catdir, parameter) {
    return api.get(`/${catdir}/list`, parameter)
  },
  // 数据新增
  dataNew(catdir, parameter) {
    return api.post(`/${catdir}/new`, parameter)
  },
  // 数据更新
  dataUpdate(catdir, parameter) {
    return api.post(`/${catdir}/update`, parameter)
  }
}
