import 'package:flutter/material.dart';
import '../../data/services/auth_api_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailFormKey = GlobalKey<FormState>();
  final _resetFormKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _tokenController = TextEditingController();
  final _newPasswordController = TextEditingController();

  bool _isSendingToken = false;
  bool _isResettingPassword = false;
  bool _tokenSent = false;
  String? _receivedTokenInfo;

  @override
  void dispose() {
    _emailController.dispose();
    _tokenController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  // Bước 1: Gửi yêu cầu mã khôi phục mật khẩu
  Future<void> _handleForgotPassword() async {
    if (!_emailFormKey.currentState!.validate()) return;

    setState(() => _isSendingToken = true);

    try {
      final response = await AuthApiService.forgotPassword(
        email: _emailController.text.trim(),
      );

      setState(() {
        _tokenSent = true;
        if (response.resetToken != null) {
          _receivedTokenInfo = response.resetToken;
          _tokenController.text = response.resetToken!;
        }
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message),
          backgroundColor: Colors.blueAccent,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.redAccent,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSendingToken = false);
    }
  }

  // Bước 2: Nhập mã khôi phục & đặt lại mật khẩu mới
  Future<void> _handleResetPassword() async {
    if (!_resetFormKey.currentState!.validate()) return;

    setState(() => _isResettingPassword = true);

    try {
      final response = await AuthApiService.resetPassword(
        token: _tokenController.text.trim(),
        newPassword: _newPasswordController.text,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context); // Quay lại màn hình đăng nhập
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.redAccent,
        ),
      );
    } finally {
      if (mounted) setState(() => _isResettingPassword = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Khôi Phục Mật Khẩu'),
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              elevation: 12,
              color: const Color(0xFF1E293B).withOpacity(0.9),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Color(0xFF334155)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: !_tokenSent ? _buildRequestTokenStep() : _buildResetPasswordStep(),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Giao diện Bước 1: Nhập Email
  Widget _buildRequestTokenStep() {
    return Form(
      key: _emailFormKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.lock_reset_rounded,
            size: 56,
            color: Color(0xFF38BDF8),
          ),
          const SizedBox(height: 12),
          const Text(
            'Quên Mật Khẩu?',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Nhập email đã đăng ký tài khoản để nhận mã xác nhận đặt lại mật khẩu.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Email tài khoản',
              labelStyle: const TextStyle(color: Colors.grey),
              prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF38BDF8)),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) return 'Vui lòng nhập Email';
              if (!value.contains('@')) return 'Email không hợp lệ';
              return null;
            },
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isSendingToken ? null : _handleForgotPassword,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0EA5E9),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSendingToken
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'GỬI MÃ XÁC XNẬN',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // Giao diện Bước 2: Nhập Mã Token & Mật khẩu mới
  Widget _buildResetPasswordStep() {
    return Form(
      key: _resetFormKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.mark_email_read_rounded,
            size: 56,
            color: Colors.greenAccent,
          ),
          const SizedBox(height: 12),
          const Text(
            'Nhập Mã Xác Nhận',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Text(
            'Mã khôi phục đã được gửi tới ${_emailController.text}.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Colors.grey),
          ),
          if (_receivedTokenInfo != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF38BDF8)),
              ),
              child: Text(
                'Mã test nhanh: $_receivedTokenInfo',
                style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold),
              ),
            ),
          ],
          const SizedBox(height: 20),
          TextFormField(
            controller: _tokenController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Mã Token khôi phục',
              labelStyle: const TextStyle(color: Colors.grey),
              prefixIcon: const Icon(Icons.key, color: Color(0xFF38BDF8)),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            validator: (value) => value == null || value.trim().isEmpty ? 'Nhập mã token' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _newPasswordController,
            obscureText: true,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Mật khẩu mới',
              labelStyle: const TextStyle(color: Colors.grey),
              prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF38BDF8)),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) return 'Nhập mật khẩu mới';
              if (value.length < 8) return 'Tối thiểu 8 ký tự';
              return null;
            },
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isResettingPassword ? null : _handleResetPassword,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isResettingPassword
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'ĐẶT LẠI MẬT KHẨU',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
