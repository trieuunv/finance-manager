import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/storage_service.dart';
import '../../data/models/category_model.dart';
import '../../data/models/wallet_model.dart';
import '../../data/services/category_api_service.dart';
import '../../data/services/wallet_api_service.dart';
import '../../data/services/transaction_api_service.dart';

IconData getCategoryIconData(String iconName) {
  switch (iconName) {
    case 'restaurant': return Icons.restaurant;
    case 'lunch_dining': return Icons.lunch_dining;
    case 'local_cafe': return Icons.local_cafe;
    case 'shopping_cart': return Icons.shopping_cart;
    case 'directions_car': return Icons.directions_car;
    case 'local_gas_station': return Icons.local_gas_station;
    case 'build': return Icons.build;
    case 'local_taxi': return Icons.local_taxi;
    case 'receipt_long': return Icons.receipt_long;
    case 'bolt': return Icons.bolt;
    case 'water_drop': return Icons.water_drop;
    case 'wifi': return Icons.wifi;
    case 'shopping_bag': return Icons.shopping_bag;
    case 'checkroom': return Icons.checkroom;
    case 'sports_esports': return Icons.sports_esports;
    case 'medical_services': return Icons.medical_services;
    case 'medication': return Icons.medication;
    case 'payments': return Icons.payments;
    case 'card_giftcard': return Icons.card_giftcard;
    case 'trending_up': return Icons.trending_up;
    default: return Icons.category;
  }
}

Color parseColor(String colorHex) {
  try {
    return Color(int.parse(colorHex.replaceFirst('#', '0xFF')));
  } catch (_) {
    return const Color(0xFF38BDF8);
  }
}

class AddTransactionModal extends StatefulWidget {
  final VoidCallback onTransactionAdded;

  const AddTransactionModal({super.key, required this.onTransactionAdded});

  @override
  State<AddTransactionModal> createState() => _AddTransactionModalState();
}

class _AddTransactionModalState extends State<AddTransactionModal> {
  String _transactionType = 'EXPENSE'; // EXPENSE, INCOME
  final TextEditingController _amountController = TextEditingController(text: '0');
  final TextEditingController _noteController = TextEditingController();
  DateTime _selectedDate = DateTime.now();

  List<WalletModel> _wallets = [];
  List<CategoryModel> _categories = [];
  WalletModel? _selectedWallet;
  CategoryModel? _selectedCategory;

  bool _isLoading = true;
  bool _isSaving = false;
  String _rawAmount = '0';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      final walletRes = await WalletApiService.getWallets(token);
      final categoriesRes = await CategoryApiService.getCategories(token);

      setState(() {
        _wallets = walletRes.wallets;
        _categories = categoriesRes;

        if (_wallets.isNotEmpty) {
          _selectedWallet = _wallets.first;
        }

        final filteredCats = _categories.where((c) => c.type == _transactionType).toList();
        if (filteredCats.isNotEmpty) {
          _selectedCategory = filteredCats.first;
        }
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onKeypadTap(String val) {
    setState(() {
      if (val == 'C') {
        _rawAmount = '0';
      } else if (val == '⌫') {
        if (_rawAmount.length > 1) {
          _rawAmount = _rawAmount.substring(0, _rawAmount.length - 1);
        } else {
          _rawAmount = '0';
        }
      } else {
        if (_rawAmount == '0') {
          _rawAmount = val;
        } else {
          if (_rawAmount.length < 12) {
            _rawAmount += val;
          }
        }
      }

      final number = double.tryParse(_rawAmount) ?? 0;
      final formatter = NumberFormat('#,###', 'vi_VN');
      _amountController.text = formatter.format(number);
    });
  }

  Future<void> _handleSave() async {
    final amount = double.tryParse(_rawAmount) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập số tiền hợp lệ (> 0)'), backgroundColor: Colors.orange),
      );
      return;
    }

    if (_selectedWallet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn ví tài khoản'), backgroundColor: Colors.orange),
      );
      return;
    }

    if (_selectedCategory == null && _transactionType != 'TRANSFER') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn danh mục thu/chi'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() => _isSaving = true);
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      final result = await TransactionApiService.createTransaction(
        token: token,
        walletId: _selectedWallet!.id,
        categoryId: _selectedCategory?.id,
        amount: amount,
        type: _transactionType,
        transactionDate: _selectedDate,
        note: _noteController.text.trim(),
      );

      if (!mounted) return;
      Navigator.pop(context);

      widget.onTransactionAdded();

      // Alert SnackBar if budget warning is present
      if (result.budgetAlert.hasWarning) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result.budgetAlert.message,
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
            ),
            backgroundColor: result.budgetAlert.budgetPercentage >= 100 ? Colors.redAccent : Colors.amber.shade800,
            duration: const Duration(seconds: 5),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thêm giao dịch mới thành công!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredCategories = _categories.where((c) => c.type == _transactionType).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
          : Column(
              children: [
                // Header Sheet
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Thêm Giao Dịch Nhanh',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.grey),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),

                // Type Toggle Tabs
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildTypeTab('EXPENSE', 'CHI TIÊU', Colors.redAccent),
                    const SizedBox(width: 16),
                    _buildTypeTab('INCOME', 'THU NHẬP', Colors.greenAccent),
                  ],
                ),
                const SizedBox(height: 16),

                // Amount Display Card
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.5)),
                  ),
                  child: Column(
                    children: [
                      const Text('Số tiền', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      const SizedBox(height: 4),
                      Text(
                        '${_amountController.text} VND',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: _transactionType == 'EXPENSE' ? Colors.redAccent : Colors.greenAccent,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Wallet Selector
                        const Text('Chọn Ví Tài Khoản', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 44,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _wallets.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 10),
                            itemBuilder: (context, index) {
                              final wallet = _wallets[index];
                              final isSelected = _selectedWallet?.id == wallet.id;
                              return ChoiceChip(
                                label: Text(
                                  '${wallet.name} (${NumberFormat('#,###', 'vi_VN').format(wallet.balance)})',
                                  style: TextStyle(
                                    color: isSelected ? Colors.black : Colors.white,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                                selected: isSelected,
                                selectedColor: const Color(0xFF38BDF8),
                                backgroundColor: const Color(0xFF1E293B),
                                onSelected: (val) {
                                  setState(() => _selectedWallet = wallet);
                                },
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Category Selector (Grid)
                        const Text('Chọn Danh Mục', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 1.1,
                          ),
                          itemCount: filteredCategories.length,
                          itemBuilder: (context, index) {
                            final cat = filteredCategories[index];
                            final isSelected = _selectedCategory?.id == cat.id;
                            final catColor = parseColor(cat.color);

                            return InkWell(
                              onTap: () {
                                setState(() => _selectedCategory = cat);
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: isSelected ? catColor.withOpacity(0.3) : const Color(0xFF1E293B),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected ? catColor : Colors.transparent,
                                    width: 2,
                                  ),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    CircleAvatar(
                                      radius: 18,
                                      backgroundColor: catColor.withOpacity(0.2),
                                      child: Icon(getCategoryIconData(cat.icon), color: catColor, size: 20),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      cat.name,
                                      style: const TextStyle(color: Colors.white, fontSize: 11),
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 16),

                        // Note Input & Date Picker
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _noteController,
                                style: const TextStyle(color: Colors.white),
                                decoration: InputDecoration(
                                  labelText: 'Ghi chú giao dịch',
                                  labelStyle: const TextStyle(color: Colors.grey),
                                  prefixIcon: const Icon(Icons.edit_note, color: Color(0xFF38BDF8)),
                                  filled: true,
                                  fillColor: const Color(0xFF1E293B),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide.none,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            IconButton.filledTonal(
                              style: IconButton.styleFrom(
                                backgroundColor: const Color(0xFF1E293B),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              icon: const Icon(Icons.calendar_today, color: Color(0xFF38BDF8)),
                              onPressed: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: _selectedDate,
                                  firstDate: DateTime(2020),
                                  lastDate: DateTime(2030),
                                );
                                if (picked != null) {
                                  setState(() => _selectedDate = picked);
                                }
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Fast Calculator Keypad Grid
                        GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: 3,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                          childAspectRatio: 2.2,
                          children: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫']
                              .map((key) => ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF1E293B),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                    onPressed: () => _onKeypadTap(key),
                                    child: Text(
                                      key,
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: key == 'C'
                                            ? Colors.redAccent
                                            : key == '⌫'
                                                ? Colors.amberAccent
                                                : Colors.white,
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),

                // Save Action Button
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0EA5E9),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _isSaving ? null : _handleSave,
                      child: _isSaving
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'LƯU GIAO DỊCH',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildTypeTab(String type, String title, Color activeColor) {
    final isSelected = _transactionType == type;

    return InkWell(
      onTap: () {
        setState(() {
          _transactionType = type;
          final filtered = _categories.where((c) => c.type == type).toList();
          _selectedCategory = filtered.isNotEmpty ? filtered.first : null;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? activeColor : Colors.grey.shade700),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? activeColor : Colors.grey,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
