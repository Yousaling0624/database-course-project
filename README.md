# 医药销售管理系统 (Pharmaceutical Sales Management System)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.18+-00ADD8?style=flat&logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react)](https://reactjs.org/)

这是一个专为数据库课程设计的全栈医药销售管理系统。该项目不仅提供了完善的进销存管理功能，还深度集成了 MySQL 的高级特性（存储过程、触发器、视图等），并将核心业务逻辑下沉至数据库层。

---

## 📖 文档导航

为了更好地理解和运行本项目，请参考以下文档：

- **[使用文档 (中文)](./使用文档.md)**：包含详细的系统介绍、高级数据库逻辑解析、快速启动指南及常见问题。
- **[数据库设计报告](./database/normalization_report.md)**：详细的范式分析 (BCNF)、E-R 图转化及物理结构设计。

---

## ✨ 核心特性

- 📊 **可视化仪表盘**：实时展示销售趋势、订单量及库存状态。
- 💊 **药品库存管理**：支持模糊搜索、分类过滤及库存水位自动预警。
- 🛒 **销售订单系统**：完整的下单流程，结合触发器实现库存实时扣减与非法交易拦截。
- 📦 **采购入库管理**：关联供应商，记录每一笔进货明细。
- 👥 **用户与权限**：分角色管理员工，支持管理员对历史数据的修订与审计。

---

## 🛠️ 技术栈

- **后端**: Go (Gin), GORM, MySQL 8.0
- **前端**: React (Vite), Tailwind CSS, Recharts
- **部署**: Docker & Docker Compose

---

## 🚀 快速启动

### 使用 Docker (推荐方式)

在根目录下运行：
```bash
docker-compose up -d
```
启动后访问：
- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:8080`

### 手动开发环境

1. **数据库**：导入 `database/init.sql` 并运行 `database/advanced_features.sql`。
2. **后端**：
   ```bash
   cd backend && go run cmd/main.go
   ```
3. **前端**：
   ```bash
   cd frontend && npm install && npm run dev
   ```

---

## 📂 项目结构

```text
├── backend/            # Go 后端源码
├── frontend/           # React 前端源码
├── database/           # SQL 脚本与设计报告
├── docker-compose.yml  # 容器化部署配置
└── 使用文档.md         # 详细使用指南
```

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
