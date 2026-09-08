import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/models/user_model.dart';

class StorageService {
  static const String _keyToken = 'auth_token';
  static const String _keyUser = 'user_data';

  // Lưu Access Token
  static Future<bool> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    return await prefs.setString(_keyToken, token);
  }

  // Lấy Access Token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  // Xóa Access Token & User Info (Đăng xuất)
  static Future<bool> clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    return await prefs.remove(_keyUser);
  }

  // Lưu thông tin User
  static Future<bool> saveUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    return await prefs.setString(_keyUser, jsonEncode(user.toJson()));
  }

  // Lấy thông tin User
  static Future<UserModel?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final String? userJson = prefs.getString(_keyUser);
    if (userJson == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(userJson));
    } catch (_) {
      return null;
    }
  }
}
