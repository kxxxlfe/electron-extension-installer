# 新增功能

- 移除 `manifest v3` 的报错提示
- 更新crx脚本

```
npm run crx

# 执行结果
更新： bhljhndlimiafopmmhjlgfpnnchjjbhd
(node:43821) ExperimentalWarning: Importing JSON modules is an experimental feature. This feature could change at any time
更新： bhljhndlimiafopmmhjlgfpnnchjjbhd 版本 0.4.1 to 0.4.1
更新： bmdblncegkenkacieihfhpjfppoconhi
更新： bmdblncegkenkacieihfhpjfppoconhi 版本 4.9.1 to 4.11.0
更新： fmkadmapgofadopljbjfkapdkoienihi
更新： fmkadmapgofadopljbjfkapdkoienihi 版本 4.27.3 to 5.0.0
更新： ienfalfjdbdpebioblfackkekamfmbnh
更新： ienfalfjdbdpebioblfackkekamfmbnh 版本 1.0.7 to 1.0.11
更新： jdkknkkbebbapilgoeccciglkfbmbnfm
更新： jdkknkkbebbapilgoeccciglkfbmbnfm 版本 4.1.4 to 4.8.0
更新： lmhkpmbekcpmknklioeibfkpmmfibljd
更新： lmhkpmbekcpmknklioeibfkpmmfibljd 版本 3.0.19 to 3.1.6
更新： nhdogjmejiglipccpnnnanhbledajbpd
更新： nhdogjmejiglipccpnnnanhbledajbpd 版本 6.5.0 to 6.6.1
更新：crx.json
更新完成
```

# Electron Extension Installer

[![npm Version](https://img.shields.io/npm/v/electron-extension-installer.svg)](https://www.npmjs.com/package/electron-extension-installer) [![License](https://img.shields.io/npm/l/electron-extension-installer.svg)](https://www.npmjs.com/package/electron-extension-installer)

# Introduction

This library is a modernized version of `electron-devtools-installer`. It is tested and works on up to electron v29. Min electron version is v11.

# Getting Started

```
npm i --save electron-extension-installer
```

# Usage

```typescript
import { installExtension, REACT_DEVELOPER_TOOLS } from "electron-extension-installer";

app.on("ready", async () => {
  await installExtension(REACT_DEVELOPER_TOOLS, {
    loadExtensionOptions: {
      allowFileAccess: true,
    },
    forceDownload: false, // 强制下载，不使用缓存
  });
});
```
