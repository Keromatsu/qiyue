// 全局提前初始化云开发（放到App外）
if (wx.cloud) {
  wx.cloud.init({
    env: "cloud1-1gn71qem5954f74e", // 你的真实环境ID
    traceUser: true,
    timeout: 10000 // 延长超时时间到10秒
  });

} else {
  console.error("❌ 请升级基础库到2.2.3以上");
}

App({
  onLaunch() {
    this.globalData = {
      config: null // 全局缓存配置
    };

    // 延迟2秒再获取配置（给云初始化留足时间）
    setTimeout(async () => {
      const configUtil = require('./utils/configUtil.js');
      try {
        const config = await configUtil.getConfig(true);
        this.globalData.config = config;
        console.log("✅ 全局配置已加载：", config);
        
        // 配置加载完成后，再获取OpenID
        wx.cloud.callFunction({ name: 'getOpenid' })
          .then(res => {
            wx.setStorageSync('openid', res.result.openid)
            console.log("✅ OpenID已获取：", res.result.openid)
          })
          .catch(err => console.error("❌ 获取OpenID失败：", err));
      } catch (err) {
        console.error("❌ 加载配置失败：", err);
      }
    }, 2000);
  }
});