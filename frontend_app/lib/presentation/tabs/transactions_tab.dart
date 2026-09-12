import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/storage_service.dart';
import '../../data/models/category_model.dart';
import '../../data/models/transaction_model.dart';
import '../../data/models/wallet_model.dart';
import '../../data/services/category_api_service.dart';
import '../../data/services/transaction_api_service.dart';
import '../../data/services/wallet_api_service.dart';
import '../widgets/add_transaction_modal.dart';

class TransactionsTab extends StatefulWidget {
  const TransactionsTab({super.key});

  @override
  State<TransactionsTab> createState() => _TransactionsTabState();
}

class _TransactionsTabState extends State<TransactionsTab> {
  bool _isLoading = true;
  List<TransactionModel> _transactions = [];
  List<WalletModel> _wallets = [];
  List<CategoryModel> _categories = [];

  final TextEditingController _searchController = TextEditingController();
  String? _selectedWalletId;
  String? _selectedCategoryId;
  String? _selectedType; // EXPENSE, INCOME, TRANSFER

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      final walletRes = await WalletApiService.getWallets(token);
      final catRes = await CategoryApiService.getCategories(token);
      final txs = await TransactionApiService.getTransactions(
        token: token,
        search: _searchController.text.trim(),
        walletId: _selectedWalletId,
        categoryId: _selectedCategoryId,
        type: _selectedType,
      );

      if (!mounted) return;
      setState(() {
        _wallets = walletRes.wallets;
        _categories = catRes;
        _transactions = txs;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _fetchTransactions() async {
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      final txs = await TransactionApiService.getTransactions(
        token: token,
        search: _searchController.text.trim(),
        walletId: _selectedWalletId,
        categoryId: _selectedCategoryId,
        type: _selectedType,
      );

      if (!mounted) return;
      setState(() => _transactions = txs);
    } catch (_) {}
  }

  Future<void> _deleteTransaction(String id) async {
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      await TransactionApiService.deleteTransaction(token, id);
      _fetchTransactions();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã xóa giao dịch thành công'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    return RefreshIndicator(
      onRefresh: _fetchTransactions,
      color: const Color(0xFF38BDF8),
      backgroundColor: const Color(0xFF1E293B),
      child: Column(
        children: [
          // Search & Filter Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  style: const TextStyle(color: Colors.white),
                  onChanged: (_) => _fetchTransactions(),
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm giao dịch theo ghi chú...',
                    hintStyle: const TextStyle(color: Colors.grey),
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF38BDF8)),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, color: Colors.grey),
                            onPressed: () {
                              _searchController.clear();
                              _fetchTransactions();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Filter chips row
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Type Filter
                      DropdownButton<String?>(
                        value: _selectedType,
                        dropdownColor: const Color(0xFF1E293B),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        underline: const SizedBox(),
                        hint: const Text('Loại Thu/Chi', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        items: const [
                          DropdownMenuItem(value: null, child: Text('Tất cả loại')),
                          DropdownMenuItem(value: 'EXPENSE', child: Text('Chi tiêu (EXPENSE)')),
                          DropdownMenuItem(value: 'INCOME', child: Text('Thu nhập (INCOME)')),
                          DropdownMenuItem(value: 'TRANSFER', child: Text('Chuyển khoản (TRANSFER)')),
                        ],
                        onChanged: (val) {
                          setState(() => _selectedType = val);
                          _fetchTransactions();
                        },
                      ),
                      const SizedBox(width: 12),

                      // Wallet Filter
                      DropdownButton<String?>(
                        value: _selectedWalletId,
                        dropdownColor: const Color(0xFF1E293B),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        underline: const SizedBox(),
                        hint: const Text('Tất cả ví', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Tất cả ví')),
                          ..._wallets.map((w) => DropdownMenuItem(value: w.id, child: Text(w.name))),
                        ],
                        onChanged: (val) {
                          setState(() => _selectedWalletId = val);
                          _fetchTransactions();
                        },
                      ),
                      const SizedBox(width: 12),

                      // Category Filter
                      DropdownButton<String?>(
                        value: _selectedCategoryId,
                        dropdownColor: const Color(0xFF1E293B),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        underline: const SizedBox(),
                        hint: const Text('Tất cả danh mục', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Tất cả danh mục')),
                          ..._categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
                        ],
                        onChanged: (val) {
                          setState(() => _selectedCategoryId = val);
                          _fetchTransactions();
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Transactions List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
                : _transactions.isEmpty
                    ? const Center(
                        child: Text('Không tìm thấy giao dịch nào', style: TextStyle(color: Colors.grey)),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: _transactions.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final tx = _transactions[index];
                          final isExpense = tx.type == 'EXPENSE';
                          final isTransfer = tx.type == 'TRANSFER';
                          final color = isExpense
                              ? Colors.redAccent
                              : isTransfer
                                  ? Colors.amberAccent
                                  : Colors.greenAccent;
                          final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(tx.transactionDate);

                          return Dismissible(
                            key: Key(tx.id),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              decoration: BoxDecoration(
                                color: Colors.redAccent,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.delete, color: Colors.white),
                            ),
                            confirmDismiss: (_) async {
                              return await showDialog(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  backgroundColor: const Color(0xFF1E293B),
                                  title: const Text('Xác nhận xóa', style: TextStyle(color: Colors.white)),
                                  content: const Text('Bạn có chắc muốn xóa giao dịch này? Số dư ví sẽ được tự động khôi phục.', style: TextStyle(color: Colors.grey)),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy', style: TextStyle(color: Colors.grey))),
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                                      onPressed: () => Navigator.pop(ctx, true),
                                      child: const Text('Xóa', style: TextStyle(color: Colors.white)),
                                    ),
                                  ],
                                ),
                              );
                            },
                            onDismissed: (_) => _deleteTransaction(tx.id),
                            child: Card(
                              color: const Color(0xFF1E293B),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                                      ? 'Chuyển tiền nội bộ'
                                      : (tx.category?.name ?? (isExpense ? 'Chi tiêu' : 'Thu nhập')),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                                subtitle: Text(
                                  'Ví: ${tx.wallet?.name ?? ''}\nNgày: $dateStr${tx.note != null && tx.note!.isNotEmpty ? '\nGhi chú: ${tx.note}' : ''}',
                                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                                ),
                                trailing: Text(
                                  '${isExpense ? '-' : isTransfer ? '' : '+'}${currencyFormatter.format(tx.amount)} VND',
                                  style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14),
                                ),
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
