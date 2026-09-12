import 'wallet_model.dart';
import 'category_model.dart';

class BudgetAlertInfo {
  final bool hasWarning;
  final double budgetPercentage;
  final String message;

  BudgetAlertInfo({
    required this.hasWarning,
    required this.budgetPercentage,
    required this.message,
  });

  factory BudgetAlertInfo.fromJson(Map<String, dynamic> json) {
    return BudgetAlertInfo(
      hasWarning: json['has_warning'] ?? json['hasWarning'] ?? false,
      budgetPercentage: (json['budget_percentage'] ?? json['budgetPercentage'] as num?)?.toDouble() ?? 0.0,
      message: json['message'] ?? '',
    );
  }
}

class TransactionModel {
  final String id;
  final String userId;
  final String walletId;
  final String? categoryId;
  final double amount;
  final String type; // EXPENSE, INCOME, TRANSFER
  final String? fromWalletId;
  final String? toWalletId;
  final DateTime transactionDate;
  final String? note;
  final WalletModel? wallet;
  final CategoryModel? category;
  final WalletModel? fromWallet;
  final WalletModel? toWallet;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.walletId,
    this.categoryId,
    required this.amount,
    required this.type,
    this.fromWalletId,
    this.toWalletId,
    required this.transactionDate,
    this.note,
    this.wallet,
    this.category,
    this.fromWallet,
    this.toWallet,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      walletId: json['walletId'] ?? '',
      categoryId: json['categoryId'],
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      type: json['type'] ?? 'EXPENSE',
      fromWalletId: json['fromWalletId'],
      toWalletId: json['toWalletId'],
      transactionDate: json['transactionDate'] != null
          ? DateTime.parse(json['transactionDate'])
          : DateTime.now(),
      note: json['note'],
      wallet: json['wallet'] != null ? WalletModel.fromJson(json['wallet']) : null,
      category: json['category'] != null ? CategoryModel.fromJson(json['category']) : null,
      fromWallet: json['fromWallet'] != null ? WalletModel.fromJson(json['fromWallet']) : null,
      toWallet: json['toWallet'] != null ? WalletModel.fromJson(json['toWallet']) : null,
    );
  }
}
