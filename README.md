# 蓝色大肥鱼 · Windows 桌宠

蓝发鲸鱼娘陪你待在桌面上：散步、吃东西、打盹、看鼠标，也会在鼠标快速晃动后揉揉眼睛。免安装，动画素材可替换。

<img src="assets/whale/portrait.png" alt="蓝色大肥鱼" width="240">

## 下载使用

到 **[Releases 下载最新版](https://github.com/LiangLiangFaner/blue-whale-desktop-pet/releases/latest)**，选择 `Blue-Whale-Desktop-Pet-Windows-x64.zip`，完整解压后双击 **蓝色大肥鱼.exe**。

适用于 Windows x64。使用下载包不需要安装 Node.js 或 Python，也不需要 API 密钥。请保留整个文件夹，不能只拿走 exe。GitHub 自动生成的 `Source code` 是源码，不是可直接运行的软件。

- 单击摸摸，拖动搬家，右键喂食或选择动作。
- 双击角色或单击托盘图标打开陪伴面板；面板可调整大小、鼠标互动、窗口边缘活动及定时互动。
- 支持随机待机、整身八帧走路姿势和实时帧间过渡；实际流畅度取决于显卡及系统负载。
- 视线跟随鼠标，快速晃动鼠标可触发揉眼睛；支持窗口边缘停靠。
- 聊天为可选功能，可自行配置兼容 OpenAI 的服务。基础桌宠、动画与小游戏可离线使用。
- 从角色或托盘右键菜单退出。关闭面板只会收起面板。

更多操作见 [使用说明](docs/使用说明.md)，替换素材见 [更新动画说明](docs/更新动画说明.md)。

## 存档与更新

首次启动会在 exe 旁创建 `data/`，保存个人设置及本机加密的密钥等运行数据。发布包不包含任何预置个人数据或密钥。更新前退出程序、备份旧文件夹，再将旧 `data/` 复制到新版本中；换电脑后可能需要重新填写密钥。

聊天内容会发送到你自行配置的服务。画面分享和自动观察默认关闭，启用后才会按相关设置提供画面给模型。请不要把自己的 `data/` 上传到仓库或随软件分享。

## 从源码运行与打包

在 Windows 上安装 Node.js 20 或更新版本，在仓库目录运行：

```powershell
npm ci
npm start
```

```powershell
npm run check
npm test
npm run test:electron
npm run pack:folder
```

`pack:folder` 在 `artifacts/蓝色大肥鱼/` 生成可复制、可压缩分享的完整免安装目录。`src/` 是程序代码，`assets/whale/` 是现成的动画图集；日常运行和打包不需要重新生成原画。

`npm run test:integration` 使用隔离测试存档，生成预览到 `docs/`。替换动画后，如需重建运动场，可安装 Python、`numpy` 和 `opencv-python`，然后运行 `npm run assets:flow`。这个仓库没有包含用于生成原画的社区参考图和历史设计过程。

## 来源与许可

作者：YunYueSama  
仓库：https://github.com/YunYueSama/codex-deepseek-pet

本仓库由 LiangLiangFaner 维护，是基于上游 `3.1.0-preview.10` 的修改版，加入或调整了免安装目录、动画速度与过渡、手脚协调、鼠标互动、窗口停靠及定时互动等。详见 [修改说明](UPSTREAM.md)。本版本不是原作者发布的原版，也不是 DeepSeek 官方产品。

遵守 [大肥鱼项目署名许可 1.0](LICENSE)（自定义许可，非 MIT）；素材及第三方权利边界见 [ASSET_LICENSE.md](ASSET_LICENSE.md)。保留原作者署名和完整许可。许可不替代底层角色参考作品可能需要的授权。
