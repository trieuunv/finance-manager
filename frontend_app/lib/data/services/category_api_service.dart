import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/category_model.dart';

class CategoryApiService {
  static Future<List<CategoryModel>> getCategories(String token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.categories),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return (resData['data'] as List)
          .map((i) => CategoryModel.fromJson(i))
          .toList();
    } else {
      throw Exception(resData['message'] ?? 'Không thể lấy danh sách danh mục');
    }
  }

  static Future<CategoryModel> createCategory({
    required String token,
    required String name,
    required String icon,
    required String color,
    required String type,
    String? parentId,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.categories),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'name': name,
        'icon': icon,
        'color': color,
        'type': type,
        'parentId': parentId,
      }),
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 201 || response.statusCode == 200) {
      return CategoryModel.fromJson(resData['data']);
    } else {
      throw Exception(resData['message'] ?? 'Không thể tạo danh mục');
    }
  }

  static Future<void> deleteCategory(String token, String id) async {
    final response = await http.delete(
      Uri.parse('${ApiConstants.categories}/$id'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      final resData = jsonDecode(response.body);
      throw Exception(resData['message'] ?? 'Không thể xóa danh mục');
    }
  }
}
