const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  console.log('开始执行活动状态更新任务')
  try {
    const now = new Date()
    
    // 查询所有进行中且已过期的活动
    const res = await db.collection('activity')
      .where({
        status: 'active',
        endTime: _.lt(now)
      })
      .get()
    
    console.log(`找到 ${res.data.length} 个已过期的活动`)
    
    if (res.data.length === 0) {
      return {
        success: true,
        message: '无已过期活动',
        updatedCount: 0
      }
    }
    
    // 批量更新活动状态
    const updatePromises = res.data.map(activity => {
      return db.collection('activity').doc(activity._id).update({
        data: {
          status: 'ended',
          updateTime: db.serverDate()
        }
      })
    })
    
    await Promise.all(updatePromises)
    
    console.log(`成功更新 ${res.data.length} 个活动状态`)
    
    return {
      success: true,
      message: `成功更新 ${res.data.length} 个活动状态`,
      updatedCount: res.data.length
    }
  } catch (err) {
    console.error('更新活动状态失败：', err)
    return {
      success: false,
      message: '更新活动状态失败',
      error: err.errMsg
    }
  }
}