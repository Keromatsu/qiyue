const db = wx.cloud.database();
const dateUtil = require('../../utils/dateUtil.js');
Page({
  data: {
    activeTab: "created",
    activityList: [],
    openid: "",
    typeMap: {
      companion: "熟人结伴",
      pin: "邻里拼单",
      team: "兴趣组队",
      signUp: "报名统计"
    },
    emptyTip: "你还没有发起任何活动～"
  },
  onLoad(options) {
    if (options.tab) {
      this.setData({ activeTab: options.tab });
    }
    this.getOpenid();
  },
  onShow() {
    if (this.data.openid) {
      this.loadActivityList(this.data.activeTab);
    }
  },
  async getOpenid() {
    try {
      let openid = wx.getStorageSync('openid');
      if (!openid) {
        const { result: { openid: newOpenid } } = await wx.cloud.callFunction({ name: "getOpenid" });
        openid = newOpenid;
        wx.setStorageSync('openid', openid);
      }
      this.setData({ openid });
      this.loadActivityList(this.data.activeTab);
    } catch (err) {
      console.error("获取OpenID失败：", err);
      wx.showToast({ title: "加载失败，请重试", icon: "none" });
    }
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.loadActivityList(tab);
  },
  async loadActivityList(tab) {
    try {
      wx.showLoading({ title: "加载中...", mask: true });
      
      const { openid } = this.data;
      if (!openid) {
        await this.getOpenid();
        return;
      }
      
      if (tab === "joined") {
        const cachedJoined = wx.getStorageSync('joinedActivities') || [];
        if (cachedJoined.length > 0) {
          this.setData({ activityList: cachedJoined });
          wx.hideLoading();
        }
      }
      
      let whereCondition = {};
      let emptyTip = "";
      switch (tab) {
        case "created":
          whereCondition = {
            creatorOpenid: openid,
            status: "active"
          };
          emptyTip = "你还没有发起任何活动～";
          break;
        case "joined":
          whereCondition = {
            participants: db.command.elemMatch({ openid: openid }),
            status: "active"
          };
          emptyTip = "你还没有参与任何活动～";
          break;
        case "ended":
          whereCondition = {
            status: "ended",
            $or: [
              { creatorOpenid: openid },
              { participants: db.command.elemMatch({ openid: openid }) }
            ]
          };
          emptyTip = "暂无已结束的活动～";
          break;
        default:
          whereCondition = { creatorOpenid: openid };
          emptyTip = "暂无相关活动～";
      }
      
      const queryPromise = db.collection("activity")
        .where(whereCondition)
        .orderBy("createTime", "desc")
        .get();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("网络超时")), 8000)
      );
      
      const res = await Promise.race([queryPromise, timeoutPromise]);
      
      const validActivities = res.data.filter(item => {
        return item._id && item.name && item.endTime && item.type;
      });
      
      console.log("加载到的活动列表：", validActivities);
      
      if (tab === "joined") {
        wx.setStorageSync('joinedActivities', validActivities.slice(0, 50));
      }
      
      this.setData({
        activityList: validActivities,
        emptyTip
      });
      
      if (tab !== "joined" || (res.data.length > 0 && !this.data.activityList.length)) {
        wx.hideLoading();
      }
    } catch (err) {
      wx.hideLoading();
      console.error("加载活动列表失败：", err);
      this.setData({
        activityList: [],
        emptyTip: "加载失败，请下拉刷新重试～"
      });
    }
  },
  formatTime(time) {
    return dateUtil.formatDateTime(time);
  },
  goDetail(e) {
    const activityId = e.currentTarget.dataset.id;
    console.log("点击的活动ID：", activityId);
    if (!activityId) {
      wx.showToast({ title: "活动数据异常", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/pages/activityDetail/activityDetail?id=${activityId}`
    });
  },
  onPullDownRefresh() {
    this.loadActivityList(this.data.activeTab)
      .catch(err => {
        console.error("下拉刷新失败：", err);
        wx.showToast({ title: "刷新失败，请重试", icon: "none" });
      })
      .finally(() => {
        wx.stopPullDownRefresh();
      });
  }
});