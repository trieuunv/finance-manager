# Maestro E2E

Yêu cầu: backend chạy `localhost:3000` (Android emulator dùng `10.0.2.2`), emulator/simulator đang bật, app đã cài (`flutter run` hoặc `flutter install`).

```
maestro test .maestro                     # tất cả
maestro test .maestro --include-tags=smoke
maestro test .maestro/flows/03_register_success_logout_login.yaml
```

Flow 03/05 tự tạo user ngẫu nhiên (`subflows/gen_user.js`) nên backend không cần seed.
`appId` Android/iOS hiện là `com.example.frontend_app`.

Chưa phủ: Ví, Giao dịch, Ngân sách, Báo cáo. Các tab (`lib/presentation/tabs/*`) và modal chưa được nối vào `HomeScreen` (quick-action card chưa có `onTap`). Nối navigation rồi mới viết flow được.
