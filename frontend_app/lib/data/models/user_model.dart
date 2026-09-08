class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String baseCurrency;
  final String? createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.baseCurrency,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? '',
      baseCurrency: json['baseCurrency'] ?? 'VND',
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'baseCurrency': baseCurrency,
      'createdAt': createdAt,
    };
  }
}
