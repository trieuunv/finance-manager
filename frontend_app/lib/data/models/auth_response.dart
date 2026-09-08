import 'user_model.dart';

class AuthResponse {
  final String message;
  final UserModel? user;
  final String? accessToken;
  final String? resetToken;

  AuthResponse({
    required this.message,
    this.user,
    this.accessToken,
    this.resetToken,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      message: json['message'] ?? '',
      user: json['user'] != null ? UserModel.fromJson(json['user']) : null,
      accessToken: json['accessToken'],
      resetToken: json['resetToken'],
    );
  }
}
