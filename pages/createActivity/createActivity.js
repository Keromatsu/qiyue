const db = wx.cloud.database();
const dateUtil = require('../../utils/dateUtil.js');
Page({
  data: {
    type: "",
    formName: "",
    selectedLocation: "",
    selectedDate: "",
    selectedTime: "",
    startDate: "",
    remindEnabled: false,
    remindOptions: [
      { name: "活动开始前1小时", value: 1 },
      { name: "活动开始前3小时", value: 3 },
      { name: "活动开始前1天", value: 24 },
      { name: "活动开始前2天", value: 48 }
    ],
    selectedRemind: {},
    fieldConfig: {},
    submitting: false,
    userInfo: {
      nickName: "微信用户",
      avatar: ""
    }
  },
  onLoad(options) {
    const type = options.type;
    if (!type) {
      wx.showToast({ title: "场景参数异常", icon: "none" });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    this.setData({ 
      type,
      selectedDate: `${year}-${month}-${day}`,
      selectedTime: `${hour}:${minute}`,
      startDate: `${year}-${month}-${day}`
    });
    this.setFieldConfig(type);
    this.getUserLocalInfo();
  },
  getUserLocalInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({ userInfo });
      }
    } catch (e) {
      console.error("读取本地用户信息失败：", e);
    }
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      'userInfo.avatar': avatarUrl
    });
    this.saveUserInfo();
  },
  onNickNameBlur(e) {
    const nickName = e.detail.value;
    this.setData({
      'userInfo.nickName': nickName || "微信用户"
    });
    this.saveUserInfo();
  },
  saveUserInfo() {
    try {
      wx.setStorageSync('userInfo', this.data.userInfo);
    } catch (e) {
      console.error("保存用户信息失败：", e);
    }
  },
  setFieldConfig(type) {
    const configMap = {
      companion: {
        title: "活动名称",
        titlePlaceholder: "聚餐/出游名称",
        location: "集合地点",
        locationPlaceholder: "点击选择集合地点",
        showLocation: true,
        locationRequired: true,
        timeLabel: "集合时间",
        mainBtnText: "活动"
      },
      pin: {
        title: "拼单名称",
        titlePlaceholder: "山姆零食/生鲜拼单",
        location: "自提地点",
        locationPlaceholder: "点击选择自提地点",
        showLocation: true,
        locationRequired: true,
        timeLabel: "自提截止时间",
        mainBtnText: "拼单"
      },
      team: {
        title: "组队名称",
        titlePlaceholder: "王者荣耀/篮球约场",
        location: "活动地点",
        locationPlaceholder: "点击选择活动地点（选填）",
        showLocation: true,
        locationRequired: false,
        timeLabel: "组队截止时间",
        mainBtnText: "组队"
      },
      signUp: {
        title: "报名名称",
        titlePlaceholder: "班级活动/公司团建",
        location: "活动地点",
        locationPlaceholder: "点击选择活动地点（选填）",
        showLocation: true,
        locationRequired: false,
        timeLabel: "报名截止时间",
        mainBtnText: "报名"
      }
    };
    const targetConfig = configMap[type];
    if (!targetConfig) {
      wx.showToast({ title: "未知场景类型", icon: "none" });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ fieldConfig: targetConfig });
  },
  chooseMapLocation() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.openLocationPicker();
            },
            fail: () => {
              wx.showModal({
                title: "需要位置权限",
                content: "获取位置权限后可使用地图选点，也可手动输入地点",
                confirmText: "去设置",
                cancelText: "手动输入",
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  } else {
                    this.showManualInputModal();
                  }
                }
              });
            }
          });
        } else {
          this.openLocationPicker();
        }
      },
      fail: () => {
        wx.showToast({ title: "权限获取失败", icon: "none" });
      }
    });
  },
  openLocationPicker() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({ selectedLocation: res.name || res.address });
      },
      fail: (err) => {
        console.error("地图选点失败：", err);
        wx.showToast({ title: "选点失败，请重试", icon: "none" });
      }
    });
  },
  showManualInputModal() {
    wx.showModal({
      title: "输入地点",
      editable: true,
      placeholderText: "请输入地点名称",
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          this.setData({ selectedLocation: res.content.trim() });
        }
      }
    });
  },
  onNameInput(e) {
    this.setData({ formName: e.detail.value });
  },
  onDateChange(e) {
    this.setData({ selectedDate: e.detail.value });
  },
  onTimeChange(e) {
    this.setData({ selectedTime: e.detail.value });
  },
  toggleRemind(e) {
    this.setData({ remindEnabled: e.detail.value });
  },
  onRemindTimeChange(e) {
    const index = e.detail.value;
    this.setData({ selectedRemind: this.data.remindOptions[index] });
  },
  handleSubmitClick(e) {
    if (this.data.submitting) {
      return;
    }
    this.submitForm(e);
  },
  async submitForm(e) {
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    const { type, selectedDate, selectedTime, remindEnabled, selectedRemind, fieldConfig, formName, selectedLocation } = this.data;
    
    if (!type) {
      wx.showToast({ title: "场景类型异常，请重新选择", icon: "none" });
      this.setData({ submitting: false });
      return;
    }
    if (!formName || formName.trim() === "") {
      wx.showToast({ title: `请输入${fieldConfig.titlePlaceholder}`, icon: "none" });
      this.setData({ submitting: false });
      return;
    }
    if (formName.length > 20) {
      wx.showToast({ title: "名称长度不能超过20个字", icon: "none" });
      this.setData({ submitting: false });
      return;
    }
    if (fieldConfig.showLocation && fieldConfig.locationRequired && (!selectedLocation || selectedLocation.trim() === "")) {
      wx.showToast({ title: `请选择${fieldConfig.location}`, icon: "none" });
      this.setData({ submitting: false });
      return;
    }
    if (!selectedDate || !selectedTime) {
      wx.showToast({ title: `请选择完整的${fieldConfig.timeLabel}`, icon: "none" });
      this.setData({ submitting: false });
      return;
    }
    
    try {
      wx.showLoading({ title: "创建中...", mask: true });
      
      const openid = wx.getStorageSync('openid');
      if (!openid) {
        wx.hideLoading();
        wx.showToast({ title: '用户信息异常，请重试', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }
      
      const now = new Date();
      const activityTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      if (isNaN(activityTime.getTime())) {
        wx.hideLoading();
        wx.showToast({ title: "时间格式异常，请重试", icon: "none" });
        this.setData({ submitting: false });
        return;
      }
      
      const minInterval = 5 * 60 * 1000;
      if (activityTime.getTime() - now.getTime() < minInterval) {
        wx.hideLoading();
        wx.showToast({ 
          title: `${fieldConfig.timeLabel}至少晚于当前时间5分钟`, 
          icon: "none" 
        });
        this.setData({ submitting: false });
        return;
      }
      
      const whereCondition = {
        creatorOpenid: openid,
        name: formName.trim(),
        status: "active"
      };
      const activityTimeHour = new Date(activityTime.setMinutes(0, 0, 0));
      const nextHour = new Date(activityTimeHour.getTime() + 60 * 60 * 1000);
      whereCondition.endTime = db.command.gte(activityTimeHour).and(db.command.lt(nextHour));
      if (selectedLocation) whereCondition.location = db.command.eq(selectedLocation.trim());
      
      const sameActivityRes = await db.collection("activity").where(whereCondition).count();
      if (sameActivityRes.total > 0) {
        wx.hideLoading();
        wx.showToast({ title: "你已创建相同的进行中活动", icon: "none" });
        this.setData({ submitting: false });
        return;
      }
      
      let remindTime = null;
      if (remindEnabled && selectedRemind.value) {
        remindTime = dateUtil.subtractTime(activityTime, selectedRemind.value, 'hour');
        if (remindTime < now) {
          wx.hideLoading();
          wx.showToast({ title: "提醒时间不能早于当前时间", icon: "none" });
          this.setData({ submitting: false });
          return;
        }
      }
      
      const addRes = await db.collection("activity").add({
        data: {
          name: formName.trim(),
          type,
          location: (selectedLocation || "").trim(),
          endTime: activityTime,
          createTime: db.serverDate(),
          creatorOpenid: openid,
          participants: [],
          remindEnabled: remindEnabled || false,
          remindTime: remindTime,
          remindSent: false,
          status: "active"
        }
      });
      
      const newActivityId = addRes._id;
      wx.hideLoading();
      
      const targetUrl = `/pages/activityDetail/activityDetail?id=${newActivityId}`;
      const mineUrl = `/pages/mine/mine?tab=created`;
      
      wx.showToast({
        title: `创建${fieldConfig.mainBtnText}成功`,
        icon: "success",
        duration: 800,
        complete: () => {
          if (newActivityId) {
            wx.navigateTo({
              url: targetUrl,
              success: () => {
                this.setData({ submitting: false });
              },
              fail: (err) => {
                console.error("跳转详情页失败：", err);
                wx.navigateTo({
                  url: mineUrl,
                  success: () => console.log("跳转我的页面成功"),
                  fail: (err2) => console.error("跳转我的页面失败：", err2),
                  complete: () => this.setData({ submitting: false })
                });
              }
            });
          } else {
            wx.navigateTo({
              url: mineUrl,
              success: () => console.log("跳转我的页面成功"),
              fail: (err) => console.error("跳转我的页面失败：", err),
              complete: () => this.setData({ submitting: false })
            });
          }
        }
      });
    } catch (err) {
      wx.hideLoading();
      console.error("创建失败：", err);
      
      wx.showModal({
        title: "创建失败",
        content: err.errMsg || "网络异常，请重试",
        confirmText: "重试",
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            this.submitForm(e);
          } else {
            this.setData({ submitting: false });
          }
        }
      });
    }
  },
  onUnload() {
    this.setData({ submitting: false });
  }
});