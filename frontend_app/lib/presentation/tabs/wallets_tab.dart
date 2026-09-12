import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/storage_service.dart';
import '../../data/models/wallet_model.dart';
import '../../data/services/wallet_api_service.dart';
import '../widgets/wallet_transfer_modal.dart';

class WalletsTab extends StatefulWidget {
  const WalletsTab({super.key});

  @override
  State<WalletsTab> createState() => _WalletsTabState();
}

class _WalletsTabState extends State<WalletsTab> {
  bool _isLoading = true;
  List<WalletModel> _wallets = [];
  double _netWorth = 0.0;

  @override
  void initState() {
    super.initState();
    _loadWallets();
  }

  Future<void> _loadWallets() async {
    setState(() => _isLoading = true);
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      final res = await WalletApiService.getWallets(token);
      if (!mounted) return;
      setState(() {
        _wallets = res.wallets;
        _netWorth = res.netWorth;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _openAddWalletDialog() {
    final nameCtrl = TextEditingController();
    final balanceCtrl = TextEditingController();
    String selectedType = 'CASH';
    bool isExcluded = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('Thêm Ví Mới', style: TextStyle(color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Tên ví (Ví dụ: Momo, Vietcombank...)',
                  labelStyle: TextStyle(color: Colors.grey),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: selectedType,
                dropdownColor: const Color(0xFF0F172A),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Loại ví', labelStyle: TextStyle(color: Colors.grey)),
                items: const [
                  DropdownMenuItem(value: 'CASH', child: Text('Tiền mặt')),
                  DropdownMenuItem(value: 'BANK', child: Text('Tài khoản Ngân hàng')),
                  DropdownMenuItem(value: 'E_WALLET', child: Text('Ví điện tử')),
                ],
                onChanged: (val) {
                  if (val != null) setDialogState(() => selectedType = val);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: balanceCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Số dư ban đầu (VND)',
                  labelStyle: TextStyle(color: Colors.grey),
                ),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('Ẩn khỏi Tổng tài sản', style: TextStyle(color: Colors.white, fontSize: 13)),
                value: isExcluded,
                activeColor: const Color(0xFF38BDF8),
                onChanged: (val) => setDialogState(() => isExcluded = val),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy', style: TextStyle(color: Colors.grey))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0EA5E9)),
              onPressed: () async {
                final name = nameCtrl.text.trim();
                final balance = double.tryParse(balanceCtrl.text) ?? 0.0;
                if (name.isEmpty) return;

                final token = await StorageService.getToken();
                if (token == null) return;

                try {
                  await WalletApiService.createWallet(
                    token: token,
                    name: name,
                    type: selectedType,
                    balance: balance,
                    currency: 'VND',
                    isExcludedFromTotal: isExcluded,
                  );
                  if (!mounted) return;
                  Navigator.pop(ctx);
                  _loadWallets();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Tạo ví mới thành công'), backgroundColor: Colors.green),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                  );
                }
              },
              child: const Text('Tạo Ví', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _openTransferModal() {
    showDialog(
      context: context,
      builder: (_) => WalletTransferModal(
        wallets: _wallets,
        onTransferSuccess: _loadWallets,
      ),
    );
  }

  IconData _getWalletIcon(String type) {
    switch (type) {
      case 'BANK':
        return Icons.account_balance;
      case 'E_WALLET':
        return Icons.account_balance_wallet;
      default:
        return Icons.payments;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    return RefreshIndicator(
      onRefresh: _loadWallets,
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
                  // Total Net Worth Summary Header Card
                  Card(
                    color: const Color(0xFF1E293B),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: const BorderSide(color: Color(0xFF334155)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('TỔNG SỐ DƯ TÍNH THUẾ & RÒNG', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          const SizedBox(height: 6),
                          Text(
                            '${currencyFormatter.format(_netWorth)} VND',
                            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0EA5E9),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: _openAddWalletDialog,
                                  icon: const Icon(Icons.add, color: Colors.white),
                                  label: const Text('Thêm Ví Mới', style: TextStyle(color: Colors.white)),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Color(0xFF38BDF8)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: _wallets.length >= 2 ? _openTransferModal : null,
                                  icon: const Icon(Icons.swap_horiz, color: Color(0xFF38BDF8)),
                                  label: const Text('Chuyển Khoản', style: TextStyle(color: Color(0xFF38BDF8))),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'Danh Sách Ví & Tài Khoản',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 12),

                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _wallets.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final wallet = _wallets[index];
                      return Card(
                        color: const Color(0xFF1E293B),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(
                            color: wallet.isExcludedFromTotal ? Colors.grey.shade800 : const Color(0xFF334155),
                          ),
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFF0EA5E9).withOpacity(0.2),
                            child: Icon(_getWalletIcon(wallet.type), color: const Color(0xFF38BDF8)),
                          ),
                          title: Row(
                            children: [
                              Text(wallet.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              if (wallet.isExcludedFromTotal) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade800,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text('Ẩn khỏi tổng', style: TextStyle(color: Colors.grey, fontSize: 10)),
                                ),
                              ],
                            ],
                          ),
                          subtitle: Text('Loại: ${wallet.type}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          trailing: Text(
                            '${currencyFormatter.format(wallet.balance)} ${wallet.currency}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
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
