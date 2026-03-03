const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()


exports.main = async (event, context) => {
  try {
    const now = new Date()
    const res = await db.collection('activity')
      .where({
        remindEnabled: true,
        remindSent: false,
        remindTime: db.command.lte(now),
        status: "active"
      })
      .get()

    const activities = res.data
    if (!activities.length) return { success: true, msg: "暂无需要提醒的活动" }

    for (const activity of activities) {
      if (!activity.name || !activity.creatorOpenid) {
        console.warn(`活动${activity._id}字段不完整，跳过提醒`);
        await db.collection('activity').doc(activity._id).update({
          data: { remindSent: true }
        });
        continue;
      }

      const participantOpenids = activity.participants ? activity.participants.map(item => item.openid) : [];
      if (!participantOpenids.length) {
        await db.collection('activity').doc(activity._id).update({
          data: { remindSent: true }
        });
        continue;
      }

      const templateId = "your-subscribe-template-id"; // 替换为你的订阅消息模板ID
      const page = `/pages/activityDetail/activityDetail?id=${activity._id}`;
      const data = {
        thing1: { value: activity.name },
        time2: { value: formatDate(activity.endTime) }, 
        thing3: { value: activity.location || "无" }
      };
      function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      try {
        await cloud.openapi.subscribeMessage.send({
          touser: activity.creatorOpenid,
          templateId,
          page,
          data
        });
      } catch (err) {
        console.error(`活动${activity._id}提醒发送失败：`, err);
      }

      await db.collection('activity').doc(activity._id).update({
        data: { remindSent: true }
      });
    }

    return { success: true, msg: "提醒发送完成" };
  } catch (err) {
    console.error("定时提醒失败：", err);
    return { success: false, msg: err.message };
  }
};