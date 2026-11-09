import 'package:flutter/material.dart';
import '../../core/services/storage_service.dart';
import '../../data/models/user_model.dart';
import '../tabs/budgets_tab.dart';
import '../tabs/dashboard_tab.dart';
import '../tabs/reports_tab.dart';
import '../tabs/transactions_tab.dart';
import '../tabs/wallets_tab.dart';
import '../widgets/add_transaction_modal.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final UserModel user;

  const HomeScreen({super.key, required this.user});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  Key _tabKey = UniqueKey();

  Future<void> _handleLogout(BuildContext context) async {
    await StorageService.clearAuthData();
    if (!context.mounted) return;

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  void _openAddTransactionModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddTransactionModal(
        onTransactionAdded: () {
          setState(() {
            _tabKey = UniqueKey();
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> tabs = [
      DashboardTab(
        key: _tabKey,
        user: widget.user,
        onOpenAddTransaction: _openAddTransactionModal,
      ),
      TransactionsTab(key: _tabKey),
      WalletsTab(key: _tabKey),
      BudgetsTab(key: _tabKey),
      ReportsTab(key: _tabKey),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text(
          'Finance Manager',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: const Color(0xFF1E293B),
        elevation: 2,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            tooltip: 'Đăng xuất',
            onPressed: () => _handleLogout(context),
          ),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: tabs,
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openAddTransactionModal,
        backgroundColor: const Color(0xFF0EA5E9),
        elevation: 4,
        shape: const CircleBorder(),
        child: const Icon(Icons.add, color: Colors.white, size: 30),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        color: const Color(0xFF1E293B),
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(0, Icons.home, 'Trang chủ'),
              _buildNavItem(1, Icons.receipt_long, 'Giao dịch'),
              const SizedBox(width: 40), // Gap for FAB
              _buildNavItem(2, Icons.account_balance_wallet, 'Ví tiền'),
              _buildNavItem(3, Icons.pie_chart_outline, 'Ngân sách'),
              _buildNavItem(4, Icons.bar_chart, 'Báo cáo'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? const Color(0xFF38BDF8) : Colors.grey;

    return InkWell(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
