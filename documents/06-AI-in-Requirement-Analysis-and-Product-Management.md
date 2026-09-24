# 06. AI trong Phân Tích Yêu Cầu & Quản Trị Sản Phẩm (AI in Requirement Analysis & Product Management)

---

## 1. Giới Thiệu Tổng Quan & Bối Cảnh (Introduction & Context)

### 1.1 Khái Niệm
**"AI in Requirement Analysis & Product Management"** là việc ứng dụng Trí tuệ Nhân tạo — đặc biệt là các mô hình ngôn ngữ lớn (Large Language Models - LLMs) và Generative AI — vào toàn bộ quy trình phát triển sản phẩm phần mềm, từ giai đoạn hình thành ý tưởng, khảo sát nhu cầu, xây dựng tài liệu đặc tả (PRD), mô hình hóa luồng nghiệp vụ đến việc tạo kịch bản kiểm thử hành vi (BDD).

Trong mô hình này, AI đóng vai trò là một **Trợ lý Thông minh (AI Co-pilot / Co-analyst)** đồng hành cùng **Product Manager (PM)** và **Business Analyst (BA)** để tăng tốc độ ra mắt sản phẩm (Time-to-Market), giảm thiểu sai sót do yếu tố con người và chuẩn hóa chất lượng tài liệu kỹ thuật.

### 1.2 Bối Cảnh Ứng Dụng Trong Dự Án Finance Manager
Trong dự án **Finance Manager** (Phần mềm quản lý chi tiêu cá nhân đa nền tảng), AI đã được tích hợp xuyên suốt để chuyển hóa các bài toán người dùng phức tạp thành chuỗi tài liệu kỹ thuật tiêu chuẩn gồm:
- Khám phá sản phẩm (`01-Product-Discovery.md`)
- Yêu cầu sản phẩm (`02-Product-Requirements-Document-PRD.md`)
- Phân tích & Mô hình hóa (`03-Requirements-Analysis.md`)
- User Stories & Tiêu chí chấp nhận (`04-User-Stories-Acceptance-Criteria.md`)
- Đặc tả tính năng & API Contracts (`05-Feature-Specifications.md`)

```mermaid
flowchart LR
    A[💡 Ý tưởng / Vấn đề Dòng tiền] -->|AI Prompting & Co-ideation| B[01. Product Discovery]
    B -->|AI Scope & Requirement Structuring| C[02. PRD]
    C -->|AI System Modeling & Diagrams| D[03. Requirements Analysis]
    D -->|AI User Story & BDD Generation| E[04. User Stories & AC]
    E -->|AI Contract Design & Rule Definition| F[05. Feature Specs]
    F -->|Ready for Engineering| G[🚀 Dev: Flutter & NestJS]
```

---

## 2. Ứng Dụng Cụ Thể Theo Từng Giai Đoạn (Lifecycle Application)

### 2.1 Giai Đoạn 1: Khám Phá Sản Phẩm (Product Discovery)
* **Thách thức truyền thống**: Tốn nhiều tuần khảo sát, tổng hợp dữ liệu rời rạc, nhận định chủ quan về đối thủ.
* **Cách AI hỗ trợ**:
  - **Mô phỏng chân dung người dùng (Synthetic Personas)**: AI phân tích và xây dựng các persona đại diện (Nguyễn Văn An - Sinh viên, Trần Thị Mai - Dân văn phòng, Lê Hoàng Nam - Freelancer) với đầy đủ thu nhập, hành vi và pain points thực tế.
  - **Phân tích cạnh tranh (Competitive Benchmarking)**: AI trích xuất và đối sánh các tính năng của Money Lover, Spendee, Notion để tìm khoảng trống thị trường (Market Gap) $\to$ Định vị sản phẩm tập trung vào **"Ghi chép dưới 5 giây"** và **"Cảnh báo thông minh theo thời gian thực"**.
  - **Xác định chỉ số thành công**: Đề xuất chỉ số kim chỉ nam (**North Star Metric**) và các khung đo lường KPIs khoa học.

### 2.2 Giai Đoạn 2: Xây Dựng PRD (Product Requirements Document)
* **Thách thức truyền thống**: Khó phân định ranh giới tính năng (Scope Creep), yêu cầu phi chức năng thường bị mơ hồ.
* **Cách AI hỗ trợ**:
  - **Phân chia Scope rõ ràng**: Tách bạch rạch ròi phiên bản v1.0 (In-Scope: Quản lý ví, ghi chép offline, ngân sách) và v2.0 (Out-of-Scope: Open Banking, quét SMS) để tối ưu nguồn lực.
  - **Chuẩn hóa yêu cầu phi chức năng (NFRs)**: Định lượng chính xác các chỉ số hiệu năng (API latency < 150ms, App Cold Start < 2s) và tiêu chuẩn bảo mật ngân hàng (JWT, Bcrypt, TLS 1.3).

### 2.3 Giai Đoạn 3: Phân Tích & Mô Hình Hóa Nghiệp Vụ (Requirements Modeling)
* **Thách thức truyền thống**: Mất nhiều thời gian vẽ sơ đồ UML, dễ bỏ sót tương tác bất đồng bộ hoặc xung đột dữ liệu.
* **Cách AI hỗ trợ**:
  - **Sinh mã Mermaid trực tiếp**: Tự động sinh mã nguồn biểu đồ tuần tự (**Sequence Diagram**) cho luồng ghi chép offline-online và lưu đồ luồng (**Flowchart**) kiểm tra cảnh báo ngân sách 80% - 100%.
  - **Thiết kế CSDL quan hệ (ERD Modeling)**: Thiết kế chuẩn hóa 6 thực thể quan trọng (`USERS`, `WALLETS`, `CATEGORIES`, `TRANSACTIONS`, `BUDGETS`, `RECURRING_TRANSACTIONS`) kèm các ràng buộc toàn vẹn khóa ngoại.
  - **Thiết lập Traceability Matrix**: Tự động ánh xạ từ Mục tiêu nghiệp vụ (BR) $\to$ Yêu cầu chức năng (FR) $\to$ Thực thể dữ liệu $\to$ Màn hình UI tương ứng.

### 2.4 Giai Đoạn 4: User Stories & Tiêu Chí Chấp Nhận (BDD / Given-When-Then)
* **Thách thức truyền thống**: User Story viết không đủ rõ ràng, QA/QC thiếu cơ sở xây dựng kịch bản kiểm thử (Test Case).
* **Cách AI hỗ trợ**:
  - **Chuẩn hóa cú pháp Agile**: Áp dụng chuẩn *"Là một [vai trò], tôi muốn [hành động], để [giá trị nhận được]"*.
  - **Bao phủ kịch bản ngoại lệ (Edge cases)**: Sinh tiêu chí chấp nhận theo định dạng **Given - When - Then (BDD)** cho cả luồng thành công (Happy Path) và các trường hợp lỗi (Negative Path: số tiền âm, email trùng, vượt hạn mức).

### 2.5 Giai Đoạn 5: Đặc Tả Kỹ Thuật & Thiết Kế API Contracts
* **Thách thức truyền thống**: Mất đồng bộ giữa đội Frontend và Backend do thiếu hợp đồng giao tiếp (API Contract) cụ thể.
* **Cách AI hỗ trợ**:
  - **Thiết kế RESTful API Schema**: Định nghĩa chi tiết cấu trúc Request/Response Body, HTTP Status Code (200, 201, 400, 403, 409).
  - **Đặc tả thuật toán & Business Rules**: Cụ thể hóa công thức tính số dư ví, quy tắc danh mục cha-con 2 cấp và cơ chế đồng bộ **Last-Write-Wins** cho kiến trúc Offline-First.

---

## 3. Bảng So Sánh Hiệu Quả: Truyền Thống vs. Có Sự Hỗ Trợ Của AI

| Tiêu chí đánh giá | Phương Pháp Truyền Thống | Phương Pháp Ứng Dụng AI | Mức Độ Cải Thiện |
|---|---|---|---|
| **Thời gian hoàn thiện bộ hồ sơ PRD** | 3 - 4 tuần | 2 - 3 ngày | ⚡ **Nhanh hơn 70 - 80%** |
| **Tính đồng nhất giữa các tài liệu** | Dễ lệch pha giữa PRD, ERD và API Specs | Nhất quán 100% nhờ prompt ngữ cảnh chuỗi | 🎯 **Độ chính xác cao** |
| **Phát hiện lỗi logic & Edge Cases** | Phụ thuộc vào kinh nghiệm cá nhân của BA | Tự động quét và gợi ý kịch bản biên | 🛡️ **Bao quát toàn diện** |
| **Chuyển giao cho đội Dev (Handoff)** | Cần nhiều cuộc họp làm rõ (Q&A meeting) | Dev đọc specs và implement được ngay | 🚀 **Giảm 50% thời gian họp** |

---

## 4. Kỹ Thuật Prompt Engineering Trong Phân Tích Yêu Cầu

Để đạt được chất lượng tài liệu như dự án **Finance Manager**, quy trình áp dụng các nguyên lý Prompt Engineering nâng cao:

### 4.1 Khung Thiết Kế Prompt (RTCE Framework)
* **Role (Vai trò)**: Đóng vai trò là Senior Lead Technical Product Manager & Business Analyst.
* **Task (Nhiệm vụ)**: Soạn thảo đặc tả luồng kiểm tra ngân sách kèm cảnh báo 80% và 100%.
* **Context (Ngữ cảnh)**: Ứng dụng Finance Manager chạy Flutter + NestJS, ưu tiên trải nghiệm nhanh và hỗ trợ offline.
* **Constraint (Ràng buộc)**: Dùng mã Mermaid flowchart, viết acceptance criteria chuẩn Given-When-Then, không đưa ra giả định thiếu căn cứ.

### 4.2 Phương Pháp Chain-of-Thought (Tư duy từng bước)
AI được định hướng suy luận theo trình tự:
$$\text{Xác định Pain Point} \to \text{Đề xuất Feature} \to \text{Thiết kế Entity ERD} \to \text{Xây dựng REST Endpoint} \to \text{Dự báo Edge Cases}$$

---

## 5. Vai Trò Của Con Người: Human-in-the-Loop (HITL)

> [!IMPORTANT]
> AI không thay thế con người mà đóng vai trò là công cụ nhân bội năng suất (**Force Multiplier**). 

Trong dự án này, sự can thiệp của con người giữ vai trò quyết định ở 3 điểm:
1. **Kiểm chứng tính khả thi thực tế (Feasibility Validation)**: Đánh giá xem kiến trúc Offline-First (SQLite + NestJS) có phù hợp với năng lực kỹ thuật và chi phí của dự án hay không.
2. **Quyết định định hướng chiến lược (Strategic Decision)**: Lựa chọn tính năng nào sẽ nằm trong bản Release v1.0 và tính năng nào dời sang v2.0.
3. **Đảm bảo bảo mật & tuân thủ (Security & Compliance)**: Rà soát các quy định về bảo mật dữ liệu tài chính cá nhân và quyền riêng tư của người dùng.

---

## 6. Kết Luận

Việc ứng dụng **AI in Requirement Analysis & Product Management** trong dự án **Finance Manager** chứng minh rằng:
- AI giúp chuẩn hóa và nâng tầm quy trình phát triển phần mềm theo chuẩn công nghiệp.
- Giúp kết nối liền mạch khoảng cách giữa góc nhìn kinh doanh (Business Requirements) và triển khai kỹ thuật (Technical Specifications).
- Tạo ra một nền tảng vững chắc, rõ ràng để đội ngũ kỹ sư triển khai mã nguồn Frontend và Backend một cách trơn tru, chính xác.
