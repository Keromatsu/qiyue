const db = wx.cloud.database();
const dateUtil = require('../../utils/dateUtil.js');
const configUtil = require('../../utils/configUtil.js'); // 新增

Page({
  data: {
    activityId: "",
    activity: {},
    formatEndTime: "",
    isCreator: false,
    isJoined: false,
    openid: "",
    userInfo: {
      nickName: "微信用户",
      avatar: ""
    },
    config: {
      subscribeMessageTemplateId: 'tbwru3J5HVtHM0hjCxaeQxhnqJNlCEqUwGBOv-f1OEI',
      isDev: false
    }
  },
  onLoad(options) {
    // 先获取配置
    configUtil.getConfig().then(config => {
      this.setData({ config });
    }).catch(console.error);
    
    // ... 原有 onLoad 逻辑 ...
  },
  async toggleJoin() {
    const { activityId, isJoined, openid, activity, userInfo, config } = this.data;
    
    if (!isJoined) {
      if (!userInfo.nickName || userInfo.nickName === "微信用户") {
        wx.showModal({
          title: "完善信息",
          content: "参与活动前请先设置昵称",
          showCancel: false
        });
        return;
      }
      
      try {
        const res = await wx.requestSubscribeMessage({
          tmplIds: [config.subscribeMessageTemplateId] // 使用动态配置
        });
        console.log('订阅消息结果：', res);
        
        if (res[config.subscribeMessageTemplateId] === 'accept') {
          this.doJoin(activityId, isJoined, openid, activity);
        } else {
          wx.showModal({
            title: '提示',
            content: '订阅消息后才能收到活动提醒哦，是否继续参与？',
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.doJoin(activityId, isJoined, openid, activity);
              }
            }
          });
        }
      } catch (err) {
        console.error('订阅消息失败：', err);
        this.doJoin(activityId, isJoined, openid, activity);
      }
    } else {
      this.doJoin(activityId, isJoined, openid, activity);
    }
  },
  async sendManualReminder() {
    if (!this.data.activity.participants || this.data.activity.participants.length === 0) {
      wx.showToast({ title: "暂无参与人，无需发送提醒", icon: "none" });
      return;
    }
    
    try {
      wx.showLoading({ title: "发送提醒中..." });
      await wx.cloud.callFunction({
        name: "sendManualReminder",
        data: { 
          activityId: this.data.activityId,
          isDev: this.data.config.isDev // 使用动态配置
        }
      });
      wx.hideLoading();
      wx.showToast({ title: "提醒发送成功", icon: "success" });
    } catch (err) {
      wx.hideLoading();
      console.error("手动提醒失败：", err);
      wx.showModal({
        title: "发送失败",
        content: "缺少对应的云函数sendManualReminder，如需使用该功能，请先在云开发控制台部署该云函数",
        showCancel: false
      });
    }
  },
  // ... 其他原有方法 ...
});