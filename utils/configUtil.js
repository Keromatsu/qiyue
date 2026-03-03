const db = wx.cloud.database()
let cachedConfig = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

/**
 * 等待云初始化完成（适配3.14.2版本，修复count()用法错误）
 */
async function waitForCloudInit() {
  return new Promise((resolve, reject) => {
    let retryCount = 0
    const maxRetry = 10 // 最多等5秒
    const check = () => {
      try {
        // 正确用法1：集合级count()（统计config集合的文档数，无doc）
        wx.cloud.database().collection('config').count({
          success: () => resolve(),
          fail: (err) => {
            if (err.errMsg.includes("Cloud API isn't enabled")) {
              retryCount++
              if (retryCount >= maxRetry) {
                reject(new Error("云初始化超时"))
              } else {
                setTimeout(check, 500)
              }
            } else {
              // 非初始化错误，直接resolve（不影响后续逻辑）
              resolve()
            }
          }
        })
      } catch (err) {
        retryCount++
        if (retryCount >= maxRetry) {
          reject(new Error("云初始化失败：" + err.message))
        } else {
          setTimeout(check, 500)
        }
      }
    }
    check()
  })
}

/**
 * 确保云初始化完成（适配3.14.2版本）
 */
function ensureCloudInit() {
  if (wx.cloud) {
    wx.cloud.init({
      env: "cloud1-1gn71qem5954f74e", // 你的真实环境ID
      traceUser: true,
      timeout: 10000
    });
  } else {
    console.error("请升级基础库到2.8.0以上版本");
  }
}

/**
 * 获取全局配置（适配3.14.2版本）
 */
async function getConfig(forceRefresh = false) {
  ensureCloudInit();
  
  try {
    await waitForCloudInit()
  } catch (err) {
    console.warn("等待云初始化失败，返回默认配置：", err)
    return {
      subscribeMessageTemplateId: 'tbwru3J5HVtHM0hjCxaeQxhnqJNlCEqUwGBOv-f1OE1',
      cloudEnvId: "cloud1-1gn71qem5954f74e",
      isDev: false
    }
  }

  const now = Date.now()
  if (!forceRefresh && cachedConfig && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedConfig;
  }
  
  try {
    // 3.14.2版本支持正常的单文档get()调用
    const res = await db.collection('config').doc('global').get()
    cachedConfig = res.data
    lastFetchTime = now
    console.log("✅ 成功读取config配置（3.14.2版本）：", cachedConfig);
    return cachedConfig;
  } catch (err) {
    console.error("获取配置失败，返回默认值：", err);
    return {
      subscribeMessageTemplateId: 'tbwru3J5HVtHM0hjCxaeQxhnqJNlCEqUwGBOv-f1OE1',
      cloudEnvId: "cloud1-1gn71qem5954f74e",
      isDev: false
    };
  }
}

module.exports = { getConfig };