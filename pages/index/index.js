Page({
  data: {
    currentSceneIndex: 0,
    autoPlayVideo: false,
    videoUrl: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/videos/experience-loop.mp4",
    showPagination: true,
    videoSectionTop: 0,
    sceneList: [
      {
        id: 1,
        title: "熟人聚餐",
        subtitle: "好友小聚，轻松组织",
        bgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/scene-dinner.jpg",
        stats: [
          { number: "8人", label: "平均人数" },
          { number: "人均50元", label: "平均消费" },
          { number: "2小时", label: "平均时长" }
        ],
        statsNote: "数据为平台历史均值",
        primaryBtnText: "组织聚餐",
        primaryAction: "companion",
        secondaryBtnText: "我的聚餐",
        secondaryAction: "created"
      },
      {
        id: 2,
        title: "发起拼单",
        subtitle: "多人拼团，优惠共享",
        bgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/scene-pin.jpg",
        stats: [
          { number: "24人", label: "平均参与" },
          { number: "3.2折", label: "平均优惠" },
          { number: "15分钟", label: "平均成团" }
        ],
        statsNote: "数据为平台历史均值",
        primaryBtnText: "立即拼单",
        primaryAction: "pin",
        secondaryBtnText: "查看拼单",
        secondaryAction: "created"
      },
      {
        id: 3,
        title: "报名统计",
        subtitle: "快速统计，高效便捷",
        bgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/scene-signUp.jpg",
        stats: [
          { number: "50人", label: "最大支持" },
          { number: "实时统计", label: "结果可见" },
          { number: "一键导出", label: "数据导出" }
        ],
        statsNote: "",
        primaryBtnText: "发起报名",
        primaryAction: "signUp",
        secondaryBtnText: "我的报名",
        secondaryAction: "created"
      },
      {
        id: 4,
        title: "兴趣组队",
        subtitle: "结伴同行，快乐加倍",
        bgImage: "https://636c-cloud1-1gn71qem5954f74e-1403214797.tcb.qcloud.la/images/scene-team.jpg",
        stats: [
          { number: "10人", label: "平均人数" },
          { number: "AA制", label: "费用模式" },
          { number: "实时沟通", label: "行程同步" }
        ],
        statsNote: "",
        primaryBtnText: "发起组队",
        primaryAction: "team",
        secondaryBtnText: "我的组队",
        secondaryAction: "created"
      }
    ]
  },
  onReady() {
    this.getVideoSectionTop();
  },
  onShow() {
    this.getVideoSectionTop();
  },
  getVideoSectionTop() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#video-section').boundingClientRect(rect => {
      if (rect) this.setData({ videoSectionTop: rect.top });
    }).exec();
  },
  onPageScroll(e) {
    const scrollTop = e.detail.scrollTop;
    const { videoSectionTop } = this.data;
    this.setData({
      showPagination: scrollTop < videoSectionTop / 2
    });
    if (scrollTop > videoSectionTop - 100 && !this.data.autoPlayVideo) {
      this.setData({ autoPlayVideo: true });
      const videoContext = wx.createVideoContext('loop-video', this);
      videoContext.play();
    } else if (scrollTop < videoSectionTop - 100 && this.data.autoPlayVideo) {
      this.setData({ autoPlayVideo: false });
      const videoContext = wx.createVideoContext('loop-video', this);
      videoContext.pause();
    }
  },
  onSwiperChange(e) {
    this.setData({ currentSceneIndex: e.detail.current });
  },
  switchSceneByDot(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentSceneIndex: index });
  },
  handlePrimaryAction() {
    const currentScene = this.data.sceneList[this.data.currentSceneIndex];
    this.goCreateActivity(currentScene.primaryAction);
  },
  handleSecondaryAction() {
    const currentScene = this.data.sceneList[this.data.currentSceneIndex];
    this.goMineList(currentScene.secondaryAction);
  },
  goCreateActivity(type) {
    wx.navigateTo({ url: `/pages/createActivity/createActivity?type=${type}` });
  },
  goMineList(tab = 'created') {
    wx.navigateTo({ url: `/pages/mine/mine?tab=${tab}` });
  },
  goTemplateSelect() {
    wx.navigateTo({ url: '/pages/templateSelect/templateSelect' });
  }
});