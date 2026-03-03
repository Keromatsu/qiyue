Page({
  data: {
    currentType: "companion",
    templateList: [
      {
        type: "companion",
        name: "熟人结伴",
        desc: "好友小聚，轻松组织",
        bgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/companion.jpg",
        icon: "👥"
      },
      {
        type: "pin",
        name: "邻里拼单",
        desc: "多人拼团，优惠共享",
        bgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/pin.jpg",
        icon: "🛒"
      },
      {
        type: "signUp",
        name: "报名统计",
        desc: "快速统计，高效便捷",
        bgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/signUp.jpg",
        icon: "📋"
      },
      {
        type: "team",
        name: "兴趣组队",
        desc: "结伴同行，快乐加倍",
        bgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/team.jpg",
        icon: "⚽"
      }
    ],
    currentTemplate: {},
    defaultBgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/default-scene.jpg"
  },
  onLoad() {
    this.updateCurrentTemplate(this.data.currentType);
  },
  selectTemplate(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.currentType) return;
    this.updateCurrentTemplate(type);
  },
  updateCurrentTemplate(type) {
    const selectedTemplate = this.data.templateList.find(item => item.type === type);
    this.setData({
      currentType: type,
      currentTemplate: selectedTemplate || this.data.templateList[0]
    });
  },
  onImageError(e) {
    console.error("图片加载失败：", e);
    this.setData({
      'currentTemplate.bgImage': this.data.defaultBgImage
    });
  },
  goCreate() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({
      url: `/pages/createActivity/createActivity?type=${this.data.currentType}`
    });
  }
});