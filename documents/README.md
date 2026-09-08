# Bộ Tài Liệu Kỹ Thuật & Sản Phẩm - Finance Manager

Chào mừng bạn đến với bộ tài liệu kỹ thuật và thiết kế sản phẩm của dự án **Finance Manager** (Phần mềm quản lý chi tiêu cá nhân).

Bộ tài liệu này được xây dựng theo tiêu chuẩn phát triển phần mềm chuyên nghiệp (Agile/Scrum & Software Product Engineering), phục vụ cho việc định hướng sản phẩm, phân tích yêu cầu, thiết kế kiến trúc và phát triển phần mềm trên nền tảng **Flutter (Frontend App)** và **NestJS (Backend API)**.

---

## 📚 Danh Mục Tài Liệu

| STT | Tài liệu | Mô tả ngắn |
|-----|----------|------------|
| 1 | 🔍 **[01. Khám Phá Sản Phẩm (Product Discovery)](01-Product-Discovery.md)** | Xác định tầm nhìn, sứ mệnh, vấn đề của người dùng, chân dung khách hàng (Personas), giải pháp giá trị, đối thủ cạnh tranh và chỉ số OKRs/KPIs. |
| 2 | 📋 **[02. Tài Liệu Yêu Cầu Sản Phẩm (PRD)](02-Product-Requirements-Document-PRD.md)** | Định nghĩa phạm vi sản phẩm (v1.0), các yêu cầu chức năng (Functional Requirements) và yêu cầu phi chức năng (Bảo mật, Hiệu năng, Mở rộng). |
| 3 | 🧠 **[03. Phân Tích Yêu Cầu (Requirements Analysis)](03-Requirements-Analysis.md)** | Luồng nghiệp vụ (Business Flow), Sơ đồ Use Case, Mô hình dữ liệu thực thể (Data Model / ERD) và Ma trận phân vết yêu cầu (Traceability Matrix). |
| 4 | ✍️ **[04. User Stories & Tiêu Chí Chấp Nhận](04-User-Stories-Acceptance-Criteria.md)** | Tập hợp các Epic, User Stories chi tiết theo chuẩn *As a... I want... So that...* kèm Tiêu chí chấp nhận chuẩn **Given-When-Then** (BDD). |
| 5 | ⚙️ **[05. Đặc Tả Tính Năng (Feature Specifications)](05-Feature-Specifications.md)** | Chi tiết giao diện & tương tác (UI/UX), Quy tắc logic nghiệp vụ (Business Rules), API RESTful Contracts và xử lý lỗi/ngoại lệ. |

---

## 🛠️ Tổng Quan Công Nghệ (Tech Stack)

- **Mobile / Web App (Frontend)**: Flutter (Dart) - Hỗ trợ đa nền tảng iOS, Android, Web.
- **Backend API**: NestJS (TypeScript, Node.js) - Kiến trúc Modular Clean Architecture.
- **Database**: PostgreSQL / SQLite (Support offline storage & sync).
- **Authentication**: JWT (JSON Web Token), OAuth2 / Google Sign-In.

---

## 🎯 Mục Tiêu Dự Án (v1.0)
1. **Ghi chép giao dịch siêu tốc**: Giúp người dùng thêm giao dịch thu/chi trong dưới 5 giây.
2. **Quản lý Ngân sách thông minh**: Đặt hạn mức chi tiêu theo danh mục, tự động cảnh báo khi sắp vượt ngưỡng (80%) hoặc quá hạn mức (100%).
3. **Báo cáo & Phân tích trực quan**: Biểu đồ trực quan giúp người dùng hiểu rõ dòng tiền và thói quen tiêu dùng.
4. **Đa tài khoản / Đa ví**: Theo dõi tiền mặt, tài khoản ngân hàng, ví điện tử và sổ tiết kiệm tại một nơi duy nhất.
