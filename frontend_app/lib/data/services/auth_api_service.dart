import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';

class AuthApiService {
  // 1. Đăng ký tài khoản
  static Future<AuthResponse> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.register),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'fullName': fullName,
      }),
    );

    final responseData = jsonDecode(response.body);

    if (response.statusCode == 201 || response.statusCode == 200) {
      return AuthResponse.fromJson(responseData);
    } else {
      final errorMessage = _extractErrorMessage(responseData);
      throw Exception(errorMessage);
    }
  }

  // 2. Đăng nhập
  static Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.login),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    final responseData = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return AuthResponse.fromJson(responseData);
    } else {
      final errorMessage = _extractErrorMessage(responseData);
      throw Exception(errorMessage);
    }
  }

  // 3. Quên mật khẩu
  static Future<AuthResponse> forgotPassword({required String email}) async {
    final response = await http.post(
      Uri.parse(ApiConstants.forgotPassword),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    final responseData = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return AuthResponse.fromJson(responseData);
    } else {
      final errorMessage = _extractErrorMessage(responseData);
      throw Exception(errorMessage);
    }
  }

  // 4. Đặt lại mật khẩu với Token
  static Future<AuthResponse> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.resetPassword),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'token': token,
        'newPassword': newPassword,
      }),
    );

    final responseData = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return AuthResponse.fromJson(responseData);
    } else {
      final errorMessage = _extractErrorMessage(responseData);
      throw Exception(errorMessage);
    }
  }

  // 5. Lấy thông tin tài khoản hiện tại (Me)
  static Future<UserModel> getMe(String token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.getMe),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final responseData = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return UserModel.fromJson(responseData);
    } else {
      final errorMessage = _extractErrorMessage(responseData);
      throw Exception(errorMessage);
    }
  }

  // Trích xuất thông điệp báo lỗi từ NestJS Exception Filter Response
  static String _extractErrorMessage(dynamic responseData) {
    if (responseData is Map && responseData.containsKey('message')) {
      final msg = responseData['message'];
      if (msg is List) {
        return msg.join(', ');
      }
      return msg.toString();
    }
    return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  }
}
