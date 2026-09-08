import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConstants {
  // Base URL cấu hình tự động phù hợp với môi trường Web, Android Emulator hoặc Desktop/iOS
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api/v1';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api/v1';
    } else {
      return 'http://localhost:3000/api/v1';
    }
  }

  // Endpoints Auth
  static String get register => '$baseUrl/auth/register';
  static String get login => '$baseUrl/auth/login';
  static String get forgotPassword => '$baseUrl/auth/forgot-password';
  static String get resetPassword => '$baseUrl/auth/reset-password';
  static String get getMe => '$baseUrl/auth/me';
}
