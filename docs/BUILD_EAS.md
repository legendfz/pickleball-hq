# EAS Build 指南

## 前置条件

1. 注册 Expo 账号：https://expo.dev
2. 安装 EAS CLI：
   ```bash
   npm install -g eas-cli
   ```
3. 登录：
   ```bash
   eas login
   ```
4. 配置项目：
   ```bash
   cd app
   eas build:configure
   ```

## 构建 Android APK (开发/测试)

```bash
cd app
eas build --platform android --profile preview
```

构建完成后，EAS 会提供下载链接。下载 APK 安装到手机测试。

## 构建 Android AAB (正式发布)

```bash
cd app
eas build --platform android --profile production
```

## 构建 iOS

```bash
cd app
eas build --platform ios --profile production
```

> ⚠️ iOS 构建需要 Apple Developer 账号 ($99/年)

## 发布到应用商店

### Google Play
```bash
eas submit --platform android
```
需要在 `eas.json` 中配置 `google-services.json`。

### App Store
```bash
eas submit --platform ios
```
需要在 `eas.json` 中配置 Apple ID 和 ASC App ID。

## 环境变量

构建时 API URL 通过 `EXPO_PUBLIC_API_URL` 环境变量注入：

| Profile | API URL |
|---------|---------|
| development | `http://localhost:3001` |
| preview | 在 `eas.json` 中配置 |
| production | 在 `eas.json` 中配置 |

在 `eas.json` 的 build profile 中设置：
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend.railway.app"
      }
    }
  }
}
```

## OTA 更新 (Over-The-Air)

支持热更新，不需要重新提交到应用商店：

```bash
cd app
eas update --branch production --message "Bug fix: ..."
```

## 常见问题

### Q: 构建超时？
EAS 免费层有构建时间限制。如果超时，可以尝试分平台构建或升级到付费计划。

### Q: iOS 签名问题？
需要在 Apple Developer Portal 创建 App ID 和 Provisioning Profile，然后在 EAS 中配置。

### Q: Android 签名问题？
EAS 默认使用自动生成的 keystore。如需自定义，在 `eas.json` 中配置 `credentialsSource`。
