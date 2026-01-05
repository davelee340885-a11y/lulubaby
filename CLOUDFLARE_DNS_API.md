# Cloudflare DNS API 文檔

## API 端點

**創建 DNS 記錄：**
```
POST https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records
```

**更新 DNS 記錄：**
```
PATCH https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{dns_record_id}
```

**刪除 DNS 記錄：**
```
DELETE https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{dns_record_id}
```

**列出 DNS 記錄：**
```
GET https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records
```

## 認證

使用 Bearer Token 認證：
```
Authorization: Bearer $CLOUDFLARE_API_TOKEN
```

## 創建 CNAME 記錄的請求格式

```json
{
  "name": "example.com",
  "type": "CNAME",
  "content": "target.example.com",
  "ttl": 1,
  "proxied": true,
  "comment": "Domain verification record"
}
```

## 參數說明

- **name** (required): DNS 記錄名稱（域名）
- **type** (required): 記錄類型（A, AAAA, CNAME, TXT, MX, etc.）
- **content** (required): 記錄內容
  - 對於 CNAME：目標主機名
  - 對於 A：IPv4 地址
  - 對於 AAAA：IPv6 地址
- **ttl**: TTL 秒數（60-86400，或 1 表示自動）
- **proxied**: 是否通過 Cloudflare 代理（橙色雲朵）
- **comment**: 可選的描述

## 重要注意事項

1. **A/AAAA 記錄不能與 CNAME 記錄共存於同一名稱**
2. **NS 記錄不能與任何其他記錄類型共存於同一名稱**
3. **域名始終以 Punycode 表示**（即使創建時使用 Unicode）

## 響應格式

成功響應（200）：
```json
{
  "success": true,
  "result": {
    "name": "example.com",
    "ttl": 3600,
    "type": "A",
    "comment": "Domain verification record",
    "content": "198.51.100.4",
    "proxied": true
  }
}
```

錯誤響應（1000）：
```json
{
  "errors": [
    {
      "code": 1000,
      "message": "error message",
      "documentation_url": "documentation_url",
      "source": {
        "pointer": "pointer"
      }
    }
  ],
  "messages": [],
  "success": false,
  "result": null
}
```

## 我們的使用場景

對於我們的域名發布系統，需要：

1. **獲取 Zone ID**：通過域名查詢 Cloudflare Zone ID
2. **創建 CNAME 記錄**：將自定義域名指向 Manus 服務器
3. **啟用 Proxy**：設置 `proxied: true` 以使用 Cloudflare CDN 和 SSL

**示例：為 lulubaby.xyz 創建 CNAME 記錄**

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "lulubaby.xyz",
    "type": "CNAME",
    "content": "manus-ai-agent.example.com",
    "ttl": 1,
    "proxied": true,
    "comment": "AI Agent custom domain"
  }'
```

## 下一步

1. 實現 Cloudflare API 客戶端模塊
2. 集成到域名註冊和發布流程
3. 為 lulubaby.xyz 配置 DNS
