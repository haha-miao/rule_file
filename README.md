# rule_file
rule
# icons

图标命名大致按类别和品牌区分：

- 国家、地区、大州、组织和全局类统一使用 `area_` 前缀。
- AI 服务使用 `ai_` 前缀。
- Apple、Microsoft、Google、Amazon 等品牌服务保留品牌前缀。
- TikTok/抖音统一使用 `tiktok_douyin`。
- 其他常规图标按服务或品牌名称命名，尽量保持简短清晰。

## icons json

https://raw.githubusercontent.com/haha-miao/rule_file/main/icons.json

重新生成：

```bash
node scripts/generate-icons-json.js
```
