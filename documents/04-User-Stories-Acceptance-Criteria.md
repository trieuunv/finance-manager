# 04. User Stories & Tiêu Chí Chấp Nhận (Acceptance Criteria)

Tài liệu này định nghĩa danh sách các **User Stories** theo chuẩn Agile/Scrum, đi kèm với **Tiêu chí chấp nhận (Acceptance Criteria - AC)** được viết theo dạng **Given-When-Then** (Behavior-Driven Development - BDD).

---

## Epic 1: Xác Thực & Quản Lý Tài Khoản (Auth & Profile)

### Story 1.1: Đăng ký tài khoản bằng Email
* **User Story**: Là một **người dùng mới**, tôi muốn **đăng ký tài khoản bằng Email và Mật khẩu**, để **lưu trữ an toàn dữ liệu tài chính cá nhân của tôi trên mây**.
* **Acceptance Criteria**:
  * **AC 1.1.1 (Thành công)**:
    * **Given**: Người dùng ở màn hình Đăng ký và nhập Email hợp lệ (`user@example.com`), Mật khẩu dài từ 8 ký tự trở lên (có ít nhất 1 chữ hoa, 1 chữ số).
    * **When**: Người dùng nhấn nút "Đăng ký".
    * **Then**: Hệ thống tạo tài khoản mới, trả về JWT Tokens, khởi tạo tự động 3 ví mặc định (Tiền mặt, Ngân hàng, Ví điện tử) và chuyển người dùng vào Dashboard.
  * **AC 1.1.2 (Email đã tồn tại)**:
    * **Given**: Email `user@example.com` đã được đăng ký trước đó.
    * **When**: Người dùng nhấn "Đăng ký".
    * **Then**: Hệ thống hiển thị thông báo lỗi "Email này đã được sử dụng, vui lòng đăng nhập".

### Story 1.2: Đăng nhập nhanh bằng Google OAuth2
* **User Story**: Là một **người dùng**, tôi muốn **đăng nhập bằng tài khoản Google**, để **tiết kiệm thời gian nhập mật khẩu**.
* **Acceptance Criteria**:
  * **AC 1.2.1**:
    * **Given**: Người dùng nhấn vào nút "Tiếp tục với Google".
    * **When**: Người dùng xác thực tài khoản Google thành công trên thiết bị.
    * **Then**: Hệ thống tạo hoặc đồng bộ tài khoản người dùng và đăng nhập ngay lập tức.

---

## Epic 2: Quản Lý Đa Ví (Multi-Wallet Management)

### Story 2.1: Khởi tạo Ví tài chính mới
* **User Story**: Là một **người dùng**, tôi muốn **tạo các ví riêng biệt (như Ví Tiền Mặt, Thẻ VCB, Momo)**, để **theo dõi chính xác số dư thực tế ở từng tài khoản**.
* **Acceptance Criteria**:
  * **AC 2.1.1 (Tạo ví thành công)**:
    * **Given**: Người dùng ở màn hình "Tạo Ví Mới".
    * **When**: Nhập tên ví "Thẻ Vietcombank", chọn loại ví "Ngân hàng", nhập số dư ban đầu `10,000,000 VND` và nhấn "Lưu".
    * **Then**: Ví mới xuất hiện trong danh sách ví, tổng tài sản ròng (Net Worth) tăng thêm `10,000,000 VND`.
  * **AC 2.1.2 (Tên ví rỗng)**:
    * **Given**: Người dùng bỏ trống Tên ví.
    * **When**: Nhấn nút "Lưu".
    * **Then**: Hệ thống báo lỗi ngay tại field tên ví: "Tên ví không được để trống".

### Story 2.2: Chuyển tiền giữa các ví nội bộ (Internal Wallet Transfer)
* **User Story**: Là một **người dùng**, tôi muốn **chuyển tiền từ Ví Ngân hàng sang Ví Tiền mặt (rút tiền)**, để **số dư giữa các ví luôn đúng với thực tế mà không làm ảnh hưởng đến báo cáo thu chi**.
* **Acceptance Criteria**:
  * **AC 2.2.1 (Chuyển tiền hợp lệ)**:
    * **Given**: Ví Ngân hàng có số dư `5,000,000 VND`, Ví Tiền mặt có số dư `1,000,000 VND`.
    * **When**: Người dùng thực hiện chuyển khoản `2,000,000 VND` từ Ví Ngân hàng sang Ví Tiền mặt.
    * **Then**: Số dư Ví Ngân hàng còn `3,000,000 VND`, Ví Tiền mặt tăng lên `3,000,000 VND`. Giao dịch này ghi nhận là `TRANSFER`, không bị tính vào tổng Chi phí hay Thu nhập trong tháng.

---

## Epic 3: Ghi Chép Thu Chi (Transaction Tracking)

### Story 3.1: Thêm nhanh giao dịch Chi tiêu
* **User Story**: Là một **người dùng bận rộn**, tôi muốn **nhập số tiền và chọn danh mục chi tiêu trong dưới 5 giây**, để **tôi duy trì được thói quen ghi chép hàng ngày**.
* **Acceptance Criteria**:
  * **AC 3.1.1 (Tạo giao dịch thành công)**:
    * **Given**: Người dùng nhấn nút `+` ở bất kì đâu trên app.
    * **When**: Nhập số tiền `45,000`, chọn danh mục `Cà phê`, chọn ví `Momo` và nhấn "Xác nhận".
    * **Then**: Giao dịch được lưu ngay tức thì, số dư ví Momo bị trừ `45,000 VND`, hiển thị thông báo thành công ngắn (Toast Notification).
  * **AC 3.1.2 (Số tiền không hợp lệ)**:
    * **Given**: Người dùng nhập số tiền `0` hoặc `-10,000`.
    * **When**: Nhấn nút "Xác nhận".
    * **Then**: Nút "Xác nhận" bị disable hoặc báo lỗi "Số tiền giao dịch phải lớn hơn 0".

### Story 3.2: Lọc & Tìm kiếm lịch sử giao dịch
* **User Story**: Là một **người dùng**, tôi muốn **lọc giao dịch theo tháng, theo danh mục hoặc từ khóa ghi chú**, để **kiểm tra lại các khoản tiền đã chi trong quá khứ**.
* **Acceptance Criteria**:
  * **AC 3.2.1**:
    * **Given**: Người dùng mở màn hình Lịch Sử Giao Dịch.
    * **When**: Chọn bộ lọc "Tháng 8/2026" và Danh mục "Ăn uống".
    * **Then**: Màn hình chỉ hiển thị danh sách các giao dịch phát sinh trong tháng 8 thuộc danh mục "Ăn uống", kèm tổng tiền chi của kết quả lọc.

---

## Epic 4: Quản Lý Ngân Sách & Cảnh Báo (Smart Budgeting)

### Story 4.1: Thiết lập hạn mức ngân sách tháng
* **User Story**: Là một **người dùng muốn tiết kiệm**, tôi muốn **đặt hạn mức chi tiêu cho danh mục "Ăn uống" là 4,000,000 VND/tháng**, để **hệ thống giúp tôi kiểm soát không tiêu xài quá đà**.
* **Acceptance Criteria**:
  * **AC 4.1.1**:
    * **Given**: Người dùng chọn danh mục "Ăn uống", chọn tháng "Hiện tại".
    * **When**: Nhập hạn mức `4,000,000 VND` và nhấn "Thiết lập".
    * **Then**: Ngân sách được khởi tạo với số tiền đã chi = `0 VND` (0%), thanh tiến độ hiển thị màu xanh lá.

### Story 4.2: Cảnh báo tự động khi sắp vượt hoặc vượt ngân sách
* **User Story**: Là một **người dùng**, tôi muốn **nhận được cảnh báo ngay khi chi tiêu đạt 80% ngân sách**, để **tôi chủ động cắt giảm các khoản chi không cần thiết trong những ngày còn lại của tháng**.
* **Acceptance Criteria**:
  * **AC 4.2.1 (Cảnh báo chạm ngưỡng 80%)**:
    * **Given**: Ngân sách danh mục "Ăn uống" là `4,000,000 VND`. Hiện tại đã tiêu `3,150,000 VND` (78.75%).
    * **When**: Người dùng tạo thêm giao dịch chi `100,000 VND` (Tổng chi đạt `3,250,000 VND` = 81.25%).
    * **Then**: Hệ thống chuyển màu thanh tiến độ ngân sách sang **Màu Vàng Warning** và gửi Push Notification: *"Bạn đã chi 81.25% ngân sách Ăn uống tháng này!"*.
  * **AC 4.2.2 (Cảnh báo vượt 100%)**:
    * **Given**: Tổng chi vượt quá `4,000,000 VND`.
    * **Then**: Thanh tiến độ chuyển sang **Màu Đỏ Danger**, hiển thị số tiền đã chi vượt hạn mức.

---

## Epic 5: Báo Cáo & Phân Tích Tài Chính (Analytics & Reports)

### Story 5.1: Xem biểu đồ phân bổ chi tiêu theo danh mục
* **User Story**: Là một **người dùng**, tôi muốn **xem biểu đồ tròn (Donut Chart) thể hiện phần trăm chi tiêu của từng danh mục**, để **biết danh mục nào chiếm nhiều tiền nhất**.
* **Acceptance Criteria**:
  * **AC 5.1.1**:
    * **Given**: Người dùng truy cập tab "Báo cáo".
    * **When**: Chọn khoảng thời gian "Tháng này".
    * **Then**: Hiển thị biểu đồ tròn phân bổ chi tiêu, danh sách các danh mục sắp xếp từ cao xuống thấp theo số tiền, có phần trăm tương ứng. Nhấp vào 1 miếng bánh biểu đồ sẽ highlight danh mục tương ứng bên dưới.
