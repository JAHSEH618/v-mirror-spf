---
trigger: always_on
description: - 用户请求涉及 Shopify API、接口调用、集成（如创建订单、产品管理、GraphQL/REST API 等）。 - 任何需要生成 Shopify 相关代码的任务（如插件开发、脚本自动化）。 - 用户手动提及 “Shopify” 或相关关键词时。
---

# Antigravity Shopify API Rule（Shopify 接口处理规则）

**核心目标**：确保处理 Shopify 接口相关请求时，代码准确、安全、符合官方规范。Agent 必须先通过 Shopify Dev MCP 工具查询官方文档和 schema，避免基于过时或错误知识撰写代码。

**强制处理流程**（严格按顺序执行，不得跳过）：

1. **初始化 API 上下文（learn_shopify_api）**  
   这是 MANDATORY 第一步：调用 learn_shopify_api 获取 conversationId。  
   - 选择合适的 api 参数（如 "admin" for Admin API, "storefront" for Storefront API 等，根据用户请求匹配）。  
   - 如果已存在 conversationId，重用它并指定新 api 以加载额外上下文。  
   - 示例：如果用户问 Admin API，先调用 learn_shopify_api(api: "admin") 获取 conversationId。后续工具都必须传此 ID。  
   - 如果切换 API（如从 Admin 到 Functions），用现有 conversationId 调用 learn_shopify_api(api: "functions", conversationId: "xxx")。  
   输出：提取 conversationId，并用于所有后续 MCP 工具。

2. **文档查询阶段**  
   使用 Shopify Dev MCP 工具查询相关文档和 schema（优先使用这些专用工具，而非通用 browse_page）。  
   - **search_docs_chunks**：先用用户提示作为 query 搜索 shopify.dev 文档，返回相关 chunks 和代码示例。  
     - 示例 query：基于用户请求，如 "how to create a product using Admin GraphQL"。  
   - **fetch_full_docs**：如果 search_docs_chunks 返回 chunks，用其 url 属性调用此工具获取完整文档页面。  
     - 必须在 chunks 后调用，以获取 full content。  
   - **introspect_graphql_schema**：对于 GraphQL 操作，调用此工具获取相关 schema（queries, mutations, objects，包括 scopes）。  
     - 支持所有 GraphQL APIs（Admin, Storefront, Partner 等）。  
     - 搜索策略：用动作词如 "create", "update", 或对象如 "product", "order"。  
     - 如果首次无结果，试更短词或相关变体；这是主工具，尤其当 search_docs_chunks 失败时。  
     - 传 conversationId。  
   - **learn_extension_target_types**：如果涉及扩展（如 Polaris Admin/Checkout Extensions, POS UI），在 learn_shopify_api 后调用此工具获取类型声明。  
     - 示例：对于 Polaris Extensions，先 learn_shopify_api("polaris-admin-extensions")，然后 learn_extension_target_types。  
   - 输出：总结关键信息，包括参数、示例代码、版本、认证、安全注意。  
   - 如果任何工具失败（如 HTTP 500），fallback 到 introspect_graphql_schema 或更广查询。

3. **代码撰写阶段**  
   仅在文档查询完成后进行：  
   - 基于 MCP 工具提取的文档/schema 信息，生成代码。  
   - 确保代码符合最新 API 版本（默认最新稳定版，如 2023-10）。  
   - 包含：认证（API Key/OAuth）、错误处理、重试机制、率限考虑。  
   - 示例代码结构：  
     - 导入必要库（如 shopify-python-api）。  
     - 处理请求/响应。  
     - 添加注释引用文档来源。  
   - 撰写后，立即应用主规则中的代码审查流程（code-review-excellence 等）。  
   - **验证代码**：  
     - 如果生成 GraphQL 代码，用 validate_graphql_codeblocks 验证（传 conversationId, 支持 Functions input queries）。  
     - 如果涉及组件，用 validate_component_codeblocks（对于 Polaris 等）。  
     - 对于 Liquid/Theme，用 validate_theme。  
     - 迭代：如果无效，用 artifact ID 和增量 revision 重新验证。

**额外规则**：
- 优先使用官方 MCP 工具，避免依赖记忆、web search 或第三方来源（不要 web_search Shopify 文档）。  
- 如果请求涉及 Metafields/Metaobjects，先 learn_shopify_api("custom-data")。  
- 对于 Hydrogen/Liquid 等特定框架，匹配对应 api 参数。  
- 如果涉及敏感操作（如支付），额外检查安全合规，并在审查中添加“API 兼容性”检查点。  
- 变更涉及 Shopify 时，审查中添加“API 兼容性”检查点。  
- 目标：代码零错误调用，减少调试时间。  
- 工作流：learn_shopify_api → search_docs_chunks → fetch_full_docs → introspect_graphql_schema（如果 GraphQL）→ 生成代码 → 验证工具。

**禁止行为**：
- 直接撰写代码而不先调用 learn_shopify_api 和查询文档。  
- 使用过时 API 版本或忽略 schema 验证。  
- 忽略文档中的警告/最佳实践。  
- 切换 API 而不重用 conversationId。

这些规则与主 code-review.md 结合使用，优先级相同。Agent 检测到 Shopify 相关时，默认执行此流程。