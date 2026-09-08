# 05. Đặc Tả Tính Năng (Feature Specification)

Tài liệu này cung cấp các đặc tả kỹ thuật chi tiết dành cho Đội ngũ Phát triển Phần mềm (Developers), Thiết kế (Designers) và Kiểm thử (QA/QC Testers).

---

## 1. Đặc Tả Giao Diện & Tương Tác (UI/UX Specifications)

### 1.1 Màn hình Dashboard Chính (Home Dashboard)
- **Khu vực 1: Header - Tổng Tài Sản Ròng (Net Worth Card)**
  - Hiển thị tổng số dư của tất cả các ví active (không bị tích chọn "Ẩn khỏi tổng tài sản").
  - Icon "Mắt" hỗ trợ Ẩn/Hiện số tiền (để đảm bảo riêng tư khi mở app ở nơi công cộng).
- **Khu vực 2: Thống kê Nhanh Thu/Chi Tháng Hiện Tại**
  - Card Thu nhập (Màu xanh lá): Tổng tiền thu trong tháng.
  - Card Chi tiêu (Màu đỏ): Tổng tiền chi trong tháng.
- **Khu vực 3: Ngân sách Nổi bật (Top Budgets)**
  - Hiển thị tối đa 3 ngân sách đang có phần trăm sử dụng cao nhất kèm progress bar.
- **Khu vực 4: Giao dịch Gần đây (Recent Transactions)**
  - Danh sách 5 giao dịch gần nhất, phân nhóm theo Ngày (Hôm nay, Hôm qua...).
- **Floating Action Button (FAB)**: Nút `+` hình tròn nổi ở giữa Bottom Navigation Bar để mở modal "Thêm Giao Dịch Nhanh".

### 1.2 Màn hình Thêm Giao Dịch Nhanh (Add Transaction Modal)
- **Input Số tiền (Amount Input)**:
  - Bàn phím số tích hợp máy tính đơn giản (hỗ trợ cộng trừ nhân chia trực tiếp trước khi nhập số tiền chính thức).
  - Tự động định dạng số theo phân cách hàng nghìn (ví dụ: `50000` $\to$ `50,000 VND`).
- **Selector Danh mục (Category Picker)**:
  - Hiển thị danh dạng Grid Icon kèm màu sắc đặc trưng.
  - Hỗ trợ tab "Gần đây" để chọn nhanh các danh mục thường xuyên dùng.
- **Selector Ví (Wallet Picker)**:
  - Mặc định chọn ví được dùng gần nhất hoặc Ví Tiền Mặt.

---

## 2. Quy Tắc Logic Nghiệp Vụ (Business Logic Rules)

### 2.1 Quy tắc Tính toán Số dư Ví (Wallet Balance Calculation)
$$\text{Số dư Ví} = \text{Số dư Ban đầu} + \sum (\text{Giao dịch THU}) - \sum (\text{Giao dịch CHI}) + \sum (\text{Chuyển vào}) - \sum (\text{Chuyển đi})$$

- Khi một giao dịch Chi tiêu bị xóa: Số dư ví tương ứng được tự động cộng lại đúng bằng số tiền của giao dịch đó.
- Khi một giao dịch Chi tiêu được cập nhật số tiền từ $A \to B$: Số dư ví điều chỉnh bằng $\text{Balance} + A - B$.

### 2.2 Quy tắc Phân cấp Danh mục (Category Hierarchy)
- Danh mục hỗ trợ tối đa **2 cấp**: Danh mục Cha (Parent Category) và Danh mục Con (Sub-category).
- Không được phép xóa Danh mục Cha nếu đang còn Danh mục Con tồn tại.
- Khi gán giao dịch vào Danh mục Con, giao dịch đó tự động tính cộng dồn vào tổng chi tiêu của Danh mục Cha khi lập Báo cáo.

### 2.3 Quy tắc Xử lý Đồng bộ Offline-Online (Offline Sync Strategy)
- Mỗi bản ghi Giao dịch ở local client tạo một chuỗi `UUID v4` duy nhất làm khóa chính `id` kèm trường `updated_at` (Client UTC Timestamp).
- Khi có kết nối Internet, Client gửi danh sách giao dịch chưa đồng bộ (`status = PENDING_SYNC`) lên Server.
- Server xử lý theo thuật toán **Last-Write-Wins**:
  - Nếu `id` chưa tồn tại trên DB Server: Thực hiện `INSERT`.
  - Nếu `id` đã tồn tại: So sánh `updated_at` giữa Client và Server. Bản ghi nào có `updated_at` mới hơn sẽ được áp dụng `UPDATE`.

---

## 3. Đặc Tả RESTful API Contracts (Backend Specs)

Toàn bộ các API đều sử dụng prefix `/api/v1` và yêu cầu Header `Authorization: Bearer <JWT_TOKEN>` (trừ các endpoint `/auth`).

### 3.1 Authentication Endpoints

#### `POST /api/v1/auth/register`
* **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "full_name": "Nguyen Van A",
  "base_currency": "VND"
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a3b8e8f0-1234-4567-89ab-cdef01234567",
      "email": "user@example.com",
      "full_name": "Nguyen Van A",
      "base_currency": "VND"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJKV1QiLC...",
      "refresh_token": "d7a8f9e0..."
    }
  }
}
```

---

### 3.2 Wallet Endpoints

#### `GET /api/v1/wallets`
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "w1111111-1111-1111-1111-111111111111",
      "name": "Ví Tiền Mặt",
      "type": "CASH",
      "balance": 2500000.00,
      "currency": "VND",
      "is_excluded_from_total": false
    },
    {
      "id": "w2222222-2222-2222-2222-222222222222",
      "name": "Vietcombank",
      "type": "BANK",
      "balance": 15000000.00,
      "currency": "VND",
      "is_excluded_from_total": false
    }
  ]
}
```

#### `POST /api/v1/wallets/transfer`
* **Request Body**:
```json
{
  "from_wallet_id": "w2222222-2222-2222-2222-222222222222",
  "to_wallet_id": "w1111111-1111-1111-1111-111111111111",
  "amount": 1000000.00,
  "transfer_date": "2026-09-08T08:30:00Z",
  "note": "Rút tiền cây ATM VCB"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Chuyển tiền giữa các ví thành công",
  "data": {
    "from_wallet_new_balance": 14000000.00,
    "to_wallet_new_balance": 3500000.00
  }
}
```

---

### 3.3 Transaction Endpoints

#### `POST /api/v1/transactions`
* **Request Body**:
```json
{
  "id": "t9999999-9999-9999-9999-999999999999",
  "wallet_id": "w1111111-1111-1111-1111-111111111111",
  "category_id": "c3333333-3333-3333-3333-333333333333",
  "amount": 55000.00,
  "type": "EXPENSE",
  "transaction_date": "2026-09-08T08:00:00Z",
  "note": "Ăn trưa bún chả"
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "transaction_id": "t9999999-9999-9999-9999-999999999999",
    "updated_wallet_balance": 3445000.00,
    "budget_alert": {
      "has_warning": true,
      "budget_percentage": 82.5,
      "message": "Chi tiêu danh mục Ăn uống đã đạt 82.5% hạn mức tháng!"
    }
  }
}
```

#### `GET /api/v1/reports/summary`
* **Query Parameters**: `month=9&year=2026`
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "period": "09/2026",
    "total_income": 20000000.00,
    "total_expense": 8500000.00,
    "net_savings": 11500000.00,
    "category_breakdown": [
      {
        "category_name": "Ăn uống",
        "category_icon": "restaurant",
        "total_amount": 3500000.00,
        "percentage": 41.18
      },
      {
        "category_name": "Tiền nhà & Tiện ích",
        "category_icon": "home",
        "total_amount": 3000000.00,
        "percentage": 35.29
      }
    ]
  }
}
```

---

## 4. Quy Định Mã Lỗi & Xử Lý Ngoại Lệ (Error Handling & HTTP Status Codes)

Hệ thống tuân thủ chuẩn Mã phản hồi HTTP (HTTP Status Code) và trả về định dạng JSON báo lỗi đồng nhất:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Số dư trong ví không đủ để thực hiện giao dịch",
    "details": null,
    "timestamp": "2026-09-08T08:35:00Z"
  }
}
```

### Các Mã Lỗi Thường Gặp

| HTTP Status | Error Code | Nguyên Nhân / Mô Tả |
|-------------|------------|---------------------|
| **400 Bad Request** | `INVALID_INPUT` | Dữ liệu đầu vào không thỏa mãn validation (VD: email sai format, số tiền âm). |
| **401 Unauthorized** | `TOKEN_EXPIRED` | JWT Access Token hết hạn hoặc không hợp lệ. |
| **403 Forbidden** | `ACCESS_DENIED` | Người dùng tìm cách truy cập/sửa ví hoặc giao dịch thuộc sở hữu của User khác. |
| **404 Not Found** | `RESOURCE_NOT_FOUND` | Không tìm thấy `wallet_id` hoặc `category_id` tương ứng trong hệ thống. |
| **409 Conflict** | `EMAIL_ALREADY_EXISTS` | Email đăng ký đã tồn tại trong cơ sở dữ liệu. |
| **500 Internal Error**| `SERVER_ERROR` | Lỗi phát sinh từ Server (Database timeout, unhandled exception). |
