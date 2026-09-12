import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/budget_model.dart';

class BudgetApiService {
  static Future<List<BudgetModel>> getBudgets({
    required String token,
    int? month,
    int? year,
  }) async {
    final queryParams = <String, String>{};
    if (month != null) queryParams['month'] = month.toString();
    if (year != null) queryParams['year'] = year.toString();

    final uri = Uri.parse(ApiConstants.budgets).replace(queryParameters: queryParams);

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
          .map((i) => BudgetModel.fromJson(i))
          .toList();
    } else {
      throw Exception(resData['message'] ?? 'Không thể tải danh sách ngân sách');
    }
  }

  static Future<BudgetModel> createOrUpdateBudget({
    required String token,
    String? categoryId,
    required double amount,
    required int month,
    required int year,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.budgets),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'categoryId': categoryId,
        'amount': amount,
        'month': month,
        'year': year,
      }),
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 201 || response.statusCode == 200) {
      return BudgetModel.fromJson(resData['data']);
    } else {
      throw Exception(resData['message'] ?? 'Không thể thiết lập ngân sách');
    }
  }

  static Future<void> deleteBudget(String token, String id) async {
    final response = await http.delete(
      Uri.parse('${ApiConstants.budgets}/$id'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      final resData = jsonDecode(response.body);
      throw Exception(resData['message'] ?? 'Không thể xóa ngân sách');
    }
  }
}
