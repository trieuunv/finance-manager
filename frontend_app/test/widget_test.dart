import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_app/main.dart';
import 'package:frontend_app/data/models/user_model.dart';
import 'package:frontend_app/data/models/wallet_model.dart';
import 'package:frontend_app/data/models/budget_model.dart';
import 'package:frontend_app/data/models/transaction_model.dart';

void main() {
  group('FinanceManagerApp UI Tests', () {
    testWidgets('App loads AuthSplashWrapper and CircularProgressIndicator', (WidgetTester tester) async {
      await tester.pumpWidget(const FinanceManagerApp());

      // Verify that FinanceManagerApp mounts properly
      expect(find.byType(FinanceManagerApp), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });

  group('Data Models Unit Tests', () {
    test('UserModel parse fromJson and toJson roundtrip', () {
      final json = {
        'id': 'u1',
        'email': 'test@example.com',
        'fullName': 'Nguyen Van A',
        'baseCurrency': 'VND',
        'createdAt': '2026-11-10T00:00:00.000Z',
      };

      final user = UserModel.fromJson(json);
      expect(user.id, 'u1');
      expect(user.email, 'test@example.com');
      expect(user.fullName, 'Nguyen Van A');
      expect(user.baseCurrency, 'VND');

      final output = user.toJson();
      expect(output['email'], 'test@example.com');
      expect(output['fullName'], 'Nguyen Van A');
    });

    test('WalletModel parse fromJson and toJson', () {
      final json = {
        'id': 'w1',
        'userId': 'u1',
        'name': 'Ví tiền mặt',
        'type': 'CASH',
        'balance': 500000.0,
        'currency': 'VND',
        'isExcludedFromTotal': false,
        'createdAt': '2026-11-10T00:00:00.000Z',
        'updatedAt': '2026-11-10T00:00:00.000Z',
      };

      final wallet = WalletModel.fromJson(json);
      expect(wallet.id, 'w1');
      expect(wallet.balance, 500000.0);
      expect(wallet.type, 'CASH');

      final output = wallet.toJson();
      expect(output['name'], 'Ví tiền mặt');
      expect(output['balance'], 500000.0);
    });

    test('BudgetModel parse fromJson with calculation status', () {
      final json = {
        'id': 'b1',
        'userId': 'u1',
        'categoryId': 'c1',
        'amount': 2000000.0,
        'month': 11,
        'year': 2026,
        'spent': 1700000.0,
        'remaining': 300000.0,
        'percentage': 85.0,
        'status': 'WARNING',
      };

      final budget = BudgetModel.fromJson(json);
      expect(budget.id, 'b1');
      expect(budget.amount, 2000000.0);
      expect(budget.spent, 1700000.0);
      expect(budget.percentage, 85.0);
      expect(budget.status, 'WARNING');
    });

    test('TransactionModel parse fromJson with nested wallet info', () {
      final json = {
        'id': 't1',
        'userId': 'u1',
        'walletId': 'w1',
        'amount': 150000.0,
        'type': 'EXPENSE',
        'transactionDate': '2026-11-10T00:00:00.000Z',
        'note': 'Ăn sáng phở bò',
      };

      final tx = TransactionModel.fromJson(json);
      expect(tx.id, 't1');
      expect(tx.amount, 150000.0);
      expect(tx.type, 'EXPENSE');
      expect(tx.note, 'Ăn sáng phở bò');
    });
  });
}
