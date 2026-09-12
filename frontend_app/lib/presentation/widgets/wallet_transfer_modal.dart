import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/storage_service.dart';
import '../../data/models/wallet_model.dart';
import '../../data/services/wallet_api_service.dart';

class WalletTransferModal extends StatefulWidget {
  final List<WalletModel> wallets;
  final VoidCallback onTransferSuccess;

  const WalletTransferModal({
    super.key,
    required this.wallets,
    required this.onTransferSuccess,
  });

  @override
  State<WalletTransferModal> createState() => _WalletTransferModalState();
}

class _WalletTransferModalState extends State<WalletTransferModal> {
  WalletModel? _fromWallet;
  WalletModel? _toWallet;
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.wallets.length >= 2) {
      _fromWallet = widget.wallets[0];
      _toWallet = widget.wallets[1];
    } else if (widget.wallets.isNotEmpty) {
      _fromWallet = widget.wallets[0];
    }
  }

  Future<void> _handleTransfer() async {
    final amount = double.tryParse(_amountController.text.replaceAll('.', '').replaceAll(',', '')) ?? 0;

    if (_fromWallet == null || _toWallet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn ví nguồn và ví đích'), backgroundColor: Colors.orange),
      );
      return;
    }

    if (_fromWallet!.id == _toWallet!.id) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ví nguồn và ví đích phải khác nhau'), backgroundColor: Colors.orange),
      );
      return;
    }

    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập số tiền hợp lệ (> 0)'), backgroundColor: Colors.orange),
      );
      return;
    }

    if (_fromWallet!.balance < amount) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Số dư trong ví nguồn không đủ'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      await WalletApiService.transfer(
        token: token,
        fromWalletId: _fromWallet!.id,
        toWalletId: _toWallet!.id,
        amount: amount,
        note: _noteController.text.trim(),
      );

      if (!mounted) return;
      Navigator.pop(context);
      widget.onTransferSuccess();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chuyển tiền giữa các ví thành công!'), backgroundColor: Colors.green),
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Row(
        children: [
          Icon(Icons.swap_horiz, color: Color(0xFF38BDF8)),
          SizedBox(width: 8),
          Text('Chuyển Tiền Nội Bộ', style: TextStyle(color: Colors.white, fontSize: 18)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // From Wallet Dropdown
            const Text('Ví Nguồn (Trừ tiền)', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 4),
            DropdownButtonFormField<WalletModel>(
              value: _fromWallet,
              dropdownColor: const Color(0xFF0F172A),
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFF0F172A),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              items: widget.wallets
                  .map((w) => DropdownMenuItem(
                        value: w,
                        child: Text('${w.name} (${NumberFormat('#,###', 'vi_VN').format(w.balance)})'),
                      ))
                  .toList(),
              onChanged: (val) => setState(() => _fromWallet = val),
            ),
            const SizedBox(height: 12),

            // To Wallet Dropdown
            const Text('Ví Đích (Cộng tiền)', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 4),
            DropdownButtonFormField<WalletModel>(
              value: _toWallet,
              dropdownColor: const Color(0xFF0F172A),
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFF0F172A),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              items: widget.wallets
                  .map((w) => DropdownMenuItem(
                        value: w,
                        child: Text('${w.name} (${NumberFormat('#,###', 'vi_VN').format(w.balance)})'),
                      ))
                  .toList(),
              onChanged: (val) => setState(() => _toWallet = val),
            ),
            const SizedBox(height: 12),

            // Amount
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Số tiền chuyển (VND)',
                labelStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF0F172A),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 12),

            // Note
            TextField(
              controller: _noteController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Ghi chú (Không bắt buộc)',
                labelStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF0F172A),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Hủy', style: TextStyle(color: Colors.grey)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0EA5E9),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: _isLoading ? null : _handleTransfer,
          child: _isLoading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Chuyển tiền', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
