import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/transaction_model.dart';

class TransactionCreateResult {
  final TransactionModel transaction;
  final double updatedWalletBalance;
  final BudgetAlertInfo budgetAlert;

  TransactionCreateResult({
    required this.transaction,
    required this.updatedWalletBalance,
    required this.budgetAlert,
  });
}

class TransactionApiService {
  static Future<List<TransactionModel>> getTransactions({
    required String token,
    String? startDate,
    String? endDate,
    String? walletId,
    String? categoryId,
    String? type,
    String? search,
    int? limit,
  }) async {
    final queryParams = <String, String>{};
    if (startDate != null && startDate.isNotEmpty) queryParams['startDate'] = startDate;
    if (endDate != null && endDate.isNotEmpty) queryParams['endDate'] = endDate;
    if (walletId != null && walletId.isNotEmpty) queryParams['walletId'] = walletId;
    if (categoryId != null && categoryId.isNotEmpty) queryParams['categoryId'] = categoryId;
    if (type != null && type.isNotEmpty) queryParams['type'] = type;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (limit != null) queryParams['limit'] = limit.toString();

    final uri = Uri.parse(ApiConstants.transactions).replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return (resData['data'] as List)
          .map((i) => TransactionModel.fromJson(i))
          .toList();
    } else {
      throw Exception(resData['message'] ?? 'Không thể tải danh sách giao dịch');
    }
  }

  static Future<TransactionCreateResult> createTransaction({
    required String token,
    required String walletId,
    String? categoryId,
    required double amount,
    required String type, // EXPENSE, INCOME, TRANSFER
    String? fromWalletId,
    String? toWalletId,
    DateTime? transactionDate,
    String? note,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.transactions),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'walletId': walletId,
        'categoryId': categoryId,
        'amount': amount,
        'type': type,
        'fromWalletId': fromWalletId,
        'toWalletId': toWalletId,
        'transactionDate': (transactionDate ?? DateTime.now()).toIso8601String(),
        'note': note,
      }),
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = resData['data'];
      return TransactionCreateResult(
        transaction: TransactionModel.fromJson(data['transaction']),
        updatedWalletBalance: (data['updatedWalletBalance'] as num?)?.toDouble() ?? 0.0,
        budgetAlert: BudgetAlertInfo.fromJson(data['budgetAlert'] ?? {}),
      );
    } else {
      throw Exception(resData['message'] ?? 'Không thể tạo giao dịch mới');
    }
  }

  static Future<void> deleteTransaction(String token, String id) async {
    final response = await http.delete(
      Uri.parse('${ApiConstants.transactions}/$id'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      final resData = jsonDecode(response.body);
      throw Exception(resData['message'] ?? 'Không thể xóa giao dịch');
    }
  }
}
