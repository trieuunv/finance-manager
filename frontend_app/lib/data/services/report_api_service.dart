import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../../core/network/api_headers.dart';
import '../models/report_summary_model.dart';

class ReportApiService {
  static Future<ReportSummaryModel> getSummary({
    required String token,
    int? month,
    int? year,
  }) async {
    final queryParams = <String, String>{};
    if (month != null) queryParams['month'] = month.toString();
    if (year != null) queryParams['year'] = year.toString();

    final uri = Uri.parse(ApiConstants.reportsSummary).replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: ApiHeaders.auth(token),
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return ReportSummaryModel.fromJson(resData['data']);
    } else {
      throw Exception(resData['message'] ?? 'Không thể tải báo cáo thống kê');
    }
  }
}
