const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { activityId, isDev: isDevParam } = event
  console.log('收到的活动ID：', activityId)
  try {
    // 先从数据库获取配置
    let config = {
      subscribeMessageTemplateId: 'tbwru3J5HVtHM0hjCxaeQxhnqJNlCEqUwGBOv-f1OEI',
      isDev: false
    }
    try {
      const configRes = await db.collection('config').doc('global').get()
      if (configRes.data) {
        config = { ...config, ...configRes.data }
      }
    } catch (err) {
      console.error('云函数获取配置失败，使用默认配置：', err)
    }
    
    // 使用传入的 isDev 优先
    const isDev = isDevParam !== undefined ? isDevParam : config.isDev
    
    const activityRes = await db.collection('activity').doc(activityId).get()
    const activity = activityRes.data
    if (!activity) {
      return {
        success: false,
        message: '活动不存在'
      }
    }
    const participants = activity.participants || []
    if (participants.length === 0) {
      return {
        success: false,
        message: '暂无参与人'
      }
    }
    
    const formatTime = (date) => {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hour = String(d.getHours()).padStart(2, '0')
      const minute = String(d.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    }
    
    const batchSize = 10
    const delayMs = 100
    const sendResults = []
    
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize)
      console.log(`正在发送第 ${i/batchSize + 1} 批，共 ${Math.ceil(participants.length/batchSize)} 批`)
      
      const batchPromises = batch.map(async (participant) => {
        try {
          const result = await cloud.openapi.subscribeMessage.send({
            touser: participant.openid,
            page: `/pages/activityDetail/activityDetail?id=${activityId}`,
            data: {
              thing1: { value: activity.name },
              date2: { value: formatTime(activity.endTime) },
              thing3: { value: activity.location || '待定' },
              thing4: { value: '记得准时参加哦～' }
            },
            templateId: config.subscribeMessageTemplateId, // 使用动态配置
            miniprogramState: isDev ? 'developer' : 'formal'
          })
          return {
            openid: participant.openid,
            success: true
          }
        } catch (err) {
          console.error(`发送失败：`, err)
          return {
            openid: participant.openid,
            success: false,
            error: err.errMsg
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      sendResults.push(...batchResults)
      
      if (i + batchSize < participants.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
    
    const successCount = sendResults.filter(r => r.success).length
    const failCount = sendResults.filter(r => !r.success).length
    return {
      success: true,
      message: `发送完成，成功${successCount}人，失败${failCount}人`,
      data: sendResults
    }
  } catch (err) {
    console.error('云函数执行失败：', err)
    return {
      success: false,
      message: '云函数执行失败',
      error: err.errMsg
    }
  }
}