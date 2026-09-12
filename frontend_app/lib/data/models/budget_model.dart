import 'category_model.dart';

class BudgetModel {
  final String id;
  final String userId;
  final String? categoryId;
  final double amount;
  final int month;
  final int year;
  final double spent;
  final double remaining;
  final double percentage;
  final String status; // OK, WARNING, DANGER
  final CategoryModel? category;

  BudgetModel({
    required this.id,
    required this.userId,
    this.categoryId,
    required this.amount,
    required this.month,
    required this.year,
    required this.spent,
    required this.remaining,
    required this.percentage,
    required this.status,
    this.category,
  });

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    return BudgetModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      categoryId: json['categoryId'],
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      month: json['month'] ?? 1,
      year: json['year'] ?? 2026,
      spent: (json['spent'] as num?)?.toDouble() ?? 0.0,
      remaining: (json['remaining'] as num?)?.toDouble() ?? 0.0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'OK',
      category: json['category'] != null ? CategoryModel.fromJson(json['category']) : null,
    );
  }
}
