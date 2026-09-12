import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/storage_service.dart';
import '../../data/models/budget_model.dart';
import '../../data/models/report_summary_model.dart';
import '../../data/models/transaction_model.dart';
import '../../data/models/user_model.dart';
import '../../data/services/budget_api_service.dart';
import '../../data/services/report_api_service.dart';
import '../../data/services/transaction_api_service.dart';
import '../../data/services/wallet_api_service.dart';
import '../widgets/add_transaction_modal.dart';

class DashboardTab extends StatefulWidget {
  final UserModel user;
  final VoidCallback onOpenAddTransaction;

  const DashboardTab({super.key, required this.user, required this.onOpenAddTransaction});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  bool _isLoading = true;
  bool _hideBalance = false;
  double _netWorth = 0.0;
  ReportSummaryModel? _summary;
  List<BudgetModel> _budgets = [];
  List<TransactionModel> _recentTransactions = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      final walletRes = await WalletApiService.getWallets(token);
      final now = DateTime.now();
      final summaryRes = await ReportApiService.getSummary(token: token, month: now.month, year: now.year);
      final budgetsRes = await BudgetApiService.getBudgets(token: token, month: now.month, year: now.year);
      final recentTxRes = await TransactionApiService.getTransactions(token: token, limit: 5);

      if (!mounted) return;
      setState(() {
        _netWorth = walletRes.netWorth;
        _summary = summaryRes;
        _budgets = budgetsRes;
        _recentTransactions = recentTxRes;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    return RefreshIndicator(
      onRefresh: _loadDashboardData,
      color: const Color(0xFF38BDF8),
      backgroundColor: const Color(0xFF1E293B),
      child: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
          : SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Welcome Header
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: const Color(0xFF0EA5E9),
                        child: Text(
                          widget.user.fullName.isNotEmpty ? widget.user.fullName[0].toUpperCase() : 'U',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Xin chào, ${widget.user.fullName} 👋',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Text(
                              widget.user.email,
                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Net Worth Card (Hide/Show eye toggle)
                  Card(
                    elevation: 4,
                    color: const Color(0xFF0F172A),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFF0EA5E9).withOpacity(0.25),
                            const Color(0xFF1E293B),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.account_balance_wallet, color: Color(0xFF38BDF8), size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'TỔNG TÀI SẢN RÒNG (NET WORTH)',
                                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              IconButton(
                                icon: Icon(
                                  _hideBalance ? Icons.visibility_off : Icons.visibility,
                                  color: Colors.white70,
                                ),
                                onPressed: () {
                                  setState(() => _hideBalance = !_hideBalance);
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _hideBalance ? '•••••••• VND' : '${currencyFormatter.format(_netWorth)} VND',
                            style: const TextStyle(
                              fontSize: 30,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Income & Expense Summary Cards
                  Row(
                    children: [
                      Expanded(
                        child: Card(
                          color: const Color(0xFF1E293B),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(color: Colors.greenAccent.withOpacity(0.3)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(14.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.arrow_downward, color: Colors.greenAccent, size: 18),
                                    SizedBox(width: 6),
                                    Text('Thu Nhập Tháng', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _hideBalance
                                      ? '•••• VND'
                                      : '${currencyFormatter.format(_summary?.totalIncome ?? 0)} VND',
                                  style: const TextStyle(
                                      color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Card(
                          color: const Color(0xFF1E293B),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(color: Colors.redAccent.withOpacity(0.3)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(14.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.arrow_upward, color: Colors.redAccent, size: 18),
                                    SizedBox(width: 6),
                                    Text('Chi Tiêu Tháng', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _hideBalance
                                      ? '•••• VND'
                                      : '${currencyFormatter.format(_summary?.totalExpense ?? 0)} VND',
                                  style: const TextStyle(
                                      color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Top Budgets Progress Card
                  if (_budgets.isNotEmpty) ...[
                    const Text(
                      'Ngân Sách Nổi Bật Tháng Này',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 10),
                    ..._budgets.take(3).map((b) {
                      final catName = b.category?.name ?? 'Tổng Hạn Mức';
                      final progress = (b.percentage / 100).clamp(0.0, 1.0);
                      Color progressColor = Colors.greenAccent;
                      if (b.status == 'WARNING') progressColor = Colors.amberAccent;
                      if (b.status == 'DANGER') progressColor = Colors.redAccent;

                      return Card(
                        color: const Color(0xFF1E293B),
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: Padding(
                          padding: const EdgeInsets.all(14.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(catName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                  Text(
                                    '${b.percentage}% (${currencyFormatter.format(b.spent)} / ${currencyFormatter.format(b.amount)})',
                                    style: TextStyle(color: progressColor, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              LinearProgressIndicator(
                                value: progress,
                                backgroundColor: const Color(0xFF334155),
                                color: progressColor,
                                minHeight: 8,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 16),
                  ],

                  // Recent Transactions Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Giao Dịch Gần Đây',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      TextButton(
                        onPressed: widget.onOpenAddTransaction,
                        child: const Text('+ Thêm mới', style: TextStyle(color: Color(0xFF38BDF8))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  if (_recentTransactions.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.receipt_long, color: Colors.grey, size: 40),
                          const SizedBox(height: 8),
                          const Text('Chưa có giao dịch nào gần đây', style: TextStyle(color: Colors.grey)),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0EA5E9)),
                            onPressed: widget.onOpenAddTransaction,
                            icon: const Icon(Icons.add, color: Colors.white),
                            label: const Text('Ghi giao dịch đầu tiên', style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _recentTransactions.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final tx = _recentTransactions[index];
                        final isExpense = tx.type == 'EXPENSE';
                        final isTransfer = tx.type == 'TRANSFER';
                        final color = isExpense
                            ? Colors.redAccent
                            : isTransfer
                                ? Colors.amberAccent
                                : Colors.greenAccent;
                        final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(tx.transactionDate);

                        return Card(
                          color: const Color(0xFF1E293B),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: color.withOpacity(0.2),
                              child: Icon(
                                isExpense
                                    ? getCategoryIconData(tx.category?.icon ?? 'category')
                                    : isTransfer
                                        ? Icons.swap_horiz
                                        : Icons.arrow_downward,
                                color: color,
                              ),
                            ),
                            title: Text(
                              isTransfer
                                  ? 'Chuyển tiền ví'
                                  : (tx.category?.name ?? (isExpense ? 'Chi tiêu' : 'Thu nhập')),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                            subtitle: Text(
                              '${tx.wallet?.name ?? 'Ví'} • $dateStr${tx.note != null && tx.note!.isNotEmpty ? ' (${tx.note})' : ''}',
                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                            trailing: Text(
                              '${isExpense ? '-' : isTransfer ? '' : '+'}${currencyFormatter.format(tx.amount)}',
                              style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
    );
  }
}
