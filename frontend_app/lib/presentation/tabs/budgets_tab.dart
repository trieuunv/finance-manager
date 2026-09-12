import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/storage_service.dart';
import '../../data/models/budget_model.dart';
import '../../data/models/category_model.dart';
import '../../data/services/budget_api_service.dart';
import '../../data/services/category_api_service.dart';
import '../widgets/add_transaction_modal.dart';

class BudgetsTab extends StatefulWidget {
  const BudgetsTab({super.key});

  @override
  State<BudgetsTab> createState() => _BudgetsTabState();
}

class _BudgetsTabState extends State<BudgetsTab> {
  bool _isLoading = true;
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;

  List<BudgetModel> _budgets = [];
  List<CategoryModel> _categories = [];

  @override
  void initState() {
    super.initState();
    _loadBudgets();
  }

  Future<void> _loadBudgets() async {
    setState(() => _isLoading = true);
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      final budgetsRes = await BudgetApiService.getBudgets(
        token: token,
        month: _selectedMonth,
        year: _selectedYear,
      );
      final catRes = await CategoryApiService.getCategories(token);

      if (!mounted) return;
      setState(() {
        _budgets = budgetsRes;
        _categories = catRes.where((c) => c.type == 'EXPENSE').toList();
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _openAddBudgetDialog() {
    CategoryModel? selectedCat;
    final amountCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('Đặt Hạn Mức Ngân Sách', style: TextStyle(color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<CategoryModel?>(
                value: selectedCat,
                dropdownColor: const Color(0xFF0F172A),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Chọn Danh Mục',
                  labelStyle: TextStyle(color: Colors.grey),
                ),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Tổng Hạn Mức Tất Cả Danh Mục')),
                  ..._categories.map((c) => DropdownMenuItem(value: c, child: Text(c.name))),
                ],
                onChanged: (val) => setDialogState(() => selectedCat = val),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Hạn mức chi tối đa cho tháng $_selectedMonth/$_selectedYear (VND)',
                  labelStyle: const TextStyle(color: Colors.grey),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy', style: TextStyle(color: Colors.grey))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0EA5E9)),
              onPressed: () async {
                final amount = double.tryParse(amountCtrl.text) ?? 0;
                if (amount <= 0) return;

                final token = await StorageService.getToken();
                if (token == null) return;

                try {
                  await BudgetApiService.createOrUpdateBudget(
                    token: token,
                    categoryId: selectedCat?.id,
                    amount: amount,
                    month: _selectedMonth,
                    year: _selectedYear,
                  );

                  if (!mounted) return;
                  Navigator.pop(ctx);
                  _loadBudgets();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Cập nhật hạn mức ngân sách thành công!'), backgroundColor: Colors.green),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                  );
                }
              },
              child: const Text('Lưu Ngân Sách', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteBudget(String id) async {
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      await BudgetApiService.deleteBudget(token, id);
      _loadBudgets();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã xóa ngân sách'), backgroundColor: Colors.green),
        );
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    return RefreshIndicator(
      onRefresh: _loadBudgets,
      color: const Color(0xFF38BDF8),
      backgroundColor: const Color(0xFF1E293B),
      child: Column(
        children: [
          // Month Year Selector Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            color: const Color(0xFF1E293B),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 18),
                  onPressed: () {
                    setState(() {
                      if (_selectedMonth == 1) {
                        _selectedMonth = 12;
                        _selectedYear--;
                      } else {
                        _selectedMonth--;
                      }
                    });
                    _loadBudgets();
                  },
                ),
                Text(
                  'Ngân Sách Tháng $_selectedMonth / $_selectedYear',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                IconButton(
                  icon: const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 18),
                  onPressed: () {
                    setState(() {
                      if (_selectedMonth == 12) {
                        _selectedMonth = 1;
                        _selectedYear++;
                      } else {
                        _selectedMonth++;
                      }
                    });
                    _loadBudgets();
                  },
                ),
              ],
            ),
          ),

          // Action bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Danh Sách Hạn Mức Chi', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0EA5E9)),
                  onPressed: _openAddBudgetDialog,
                  icon: const Icon(Icons.add, color: Colors.white, size: 18),
                  label: const Text('Đặt Ngân Sách', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
                : _budgets.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.pie_chart_outline, color: Colors.grey, size: 48),
                            const SizedBox(height: 12),
                            Text(
                              'Chưa có ngân sách cho tháng $_selectedMonth/$_selectedYear',
                              style: const TextStyle(color: Colors.grey),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0EA5E9)),
                              onPressed: _openAddBudgetDialog,
                              child: const Text('Thêm Ngân Sách Ngay', style: TextStyle(color: Colors.white)),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _budgets.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final budget = _budgets[index];
                          final catName = budget.category?.name ?? 'Tổng Chi Tiêu Tất Cả Danh Mục';
                          final progress = (budget.percentage / 100).clamp(0.0, 1.0);

                          Color statusColor = Colors.greenAccent;
                          String statusText = 'An toàn (< 80%)';
                          if (budget.status == 'WARNING') {
                            statusColor = Colors.amberAccent;
                            statusText = '⚡ Cảnh báo vàng (≥ 80%)';
                          } else if (budget.status == 'DANGER') {
                            statusColor = Colors.redAccent;
                            statusText = '⚠️ Cảnh báo đỏ (≥ 100%)';
                          }

                          return Card(
                            color: const Color(0xFF1E293B),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(color: statusColor.withOpacity(0.5), width: 1.5),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 16,
                                            backgroundColor: statusColor.withOpacity(0.2),
                                            child: Icon(
                                              getCategoryIconData(budget.category?.icon ?? 'category'),
                                              color: statusColor,
                                              size: 18,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            catName,
                                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                          ),
                                        ],
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: Colors.grey, size: 20),
                                        onPressed: () => _deleteBudget(budget.id),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Đã dùng: ${currencyFormatter.format(budget.spent)} VND',
                                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                                      ),
                                      Text(
                                        'Hạn mức: ${currencyFormatter.format(budget.amount)} VND',
                                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(6),
                                    child: LinearProgressIndicator(
                                      value: progress,
                                      backgroundColor: const Color(0xFF334155),
                                      color: statusColor,
                                      minHeight: 10,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        statusText,
                                        style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                      Text(
                                        'Còn lại: ${currencyFormatter.format(budget.remaining)} VND (${budget.percentage}%)',
                                        style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
