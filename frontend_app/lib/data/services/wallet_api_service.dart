import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/wallet_model.dart';

class WalletFetchResult {
  final List<WalletModel> wallets;
  final double netWorth;

  WalletFetchResult({required this.wallets, required this.netWorth});
}

class WalletApiService {
  static Future<WalletFetchResult> getWallets(String token) async {
    final response = await http.get(
      Uri.parse(ApiConstants.wallets),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 200) {
      final list = (resData['data'] as List)
          .map((i) => WalletModel.fromJson(i))
          .toList();
      final netWorth = (resData['netWorth'] as num?)?.toDouble() ?? 0.0;
      return WalletFetchResult(wallets: list, netWorth: netWorth);
    } else {
      throw Exception(resData['message'] ?? 'Không thể tải danh sách ví');
    }
  }

  static Future<WalletModel> createWallet({
    required String token,
    required String name,
    required String type,
    required double balance,
    required String currency,
    bool isExcludedFromTotal = false,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.wallets),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'name': name,
        'type': type,
        'balance': balance,
        'currency': currency,
        'isExcludedFromTotal': isExcludedFromTotal,
      }),
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 201 || response.statusCode == 200) {
      return WalletModel.fromJson(resData['data']);
    } else {
      throw Exception(resData['message'] ?? 'Không thể tạo ví mới');
    }
  }

  static Future<WalletModel> updateWallet({
    required String token,
    required String walletId,
    String? name,
    String? type,
    double? balance,
    bool? isExcludedFromTotal,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (type != null) body['type'] = type;
    if (balance != null) body['balance'] = balance;
    if (isExcludedFromTotal != null) body['isExcludedFromTotal'] = isExcludedFromTotal;

    final response = await http.patch(
      Uri.parse('${ApiConstants.wallets}/$walletId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return WalletModel.fromJson(resData['data']);
    } else {
      throw Exception(resData['message'] ?? 'Không thể cập nhật ví');
    }
  }

  static Future<void> deleteWallet(String token, String walletId) async {
    final response = await http.delete(
      Uri.parse('${ApiConstants.wallets}/$walletId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      final resData = jsonDecode(response.body);
      throw Exception(resData['message'] ?? 'Không thể xóa ví');
    }
  }

  static Future<void> transfer({
    required String token,
    required String fromWalletId,
    required String toWalletId,
    required double amount,
    String? note,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.walletTransfer),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'fromWalletId': fromWalletId,
        'toWalletId': toWalletId,
        'amount': amount,
        'note': note,
      }),
    );

    final resData = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception(resData['message'] ?? 'Chuyển tiền thất bại');
    }
  }
}
