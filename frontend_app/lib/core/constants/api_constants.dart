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

  // Endpoints Wallets
  static String get wallets => '$baseUrl/wallets';
  static String get walletTransfer => '$baseUrl/wallets/transfer';

  // Endpoints Categories
  static String get categories => '$baseUrl/categories';

  // Endpoints Transactions
  static String get transactions => '$baseUrl/transactions';

  // Endpoints Budgets
  static String get budgets => '$baseUrl/budgets';

  // Endpoints Reports
  static String get reportsSummary => '$baseUrl/reports/summary';
  static String get reportsCashFlow => '$baseUrl/reports/cash-flow';

  // Endpoints Savings Goals
  static String get savingsGoals => '$baseUrl/savings-goals';

  // Endpoints Debts & Loans
  static String get debtsLoans => '$baseUrl/debts-loans';

  // Endpoints Tags
  static String get tags => '$baseUrl/tags';

  // Endpoints Recurring Transactions
  static String get recurringTransactions => '$baseUrl/recurring-transactions';

  // Endpoints OCR
  static String get ocrScanReceipt => '$baseUrl/ocr/scan-receipt';
}
