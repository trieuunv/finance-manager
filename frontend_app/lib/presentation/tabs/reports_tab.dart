import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/storage_service.dart';
import '../../data/models/report_summary_model.dart';
import '../../data/services/report_api_service.dart';
import '../widgets/add_transaction_modal.dart';

class ReportsTab extends StatefulWidget {
  const ReportsTab({super.key});

  @override
  State<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends State<ReportsTab> {
  bool _isLoading = true;
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;
  int _touchedIndex = -1;

  ReportSummaryModel? _summary;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() => _isLoading = true);
    final token = await StorageService.getToken();
    if (token == null) return;

    try {
      final summary = await ReportApiService.getSummary(
        token: token,
        month: _selectedMonth,
        year: _selectedYear,
      );

      if (!mounted) return;
      setState(() {
        _summary = summary;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<PieChartSectionData> _buildPieSections() {
    if (_summary == null || _summary!.categoryBreakdown.isEmpty) {
      return [];
    }

    return List.generate(_summary!.categoryBreakdown.length, (i) {
      final item = _summary!.categoryBreakdown[i];
      final isTouched = i == _touchedIndex;
      final radius = isTouched ? 55.0 : 45.0;
      final fontSize = isTouched ? 16.0 : 12.0;

      return PieChartSectionData(
        color: parseColor(item.categoryColor),
        value: item.totalAmount,
        title: '${item.percentage}%',
        radius: radius,
        titleStyle: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat('#,###', 'vi_VN');

    return RefreshIndicator(
      onRefresh: _loadReport,
      color: const Color(0xFF38BDF8),
      backgroundColor: const Color(0xFF1E293B),
      child: Column(
        children: [
          // Month Selector Header
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
                    _loadReport();
                  },
                ),
                Text(
                  'Báo Cáo Tháng $_selectedMonth / $_selectedYear',
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
                    _loadReport();
                  },
                ),
              ],
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
                : _summary == null
                    ? const Center(child: Text('Không có dữ liệu báo cáo', style: TextStyle(color: Colors.grey)))
                    : SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Summary Cards Overview
                            Row(
                              children: [
                                _buildSummaryTile('Tổng Thu', _summary!.totalIncome, Colors.greenAccent, currencyFormatter),
                                const SizedBox(width: 8),
                                _buildSummaryTile('Tổng Chi', _summary!.totalExpense, Colors.redAccent, currencyFormatter),
                                const SizedBox(width: 8),
                                _buildSummaryTile('Thặng Dư', _summary!.netSavings, const Color(0xFF38BDF8), currencyFormatter),
                              ],
                            ),
                            const SizedBox(height: 24),

                            // Donut Chart Header
                            const Text(
                              'Cơ Cấu Chi Tiêu Theo Danh Mục',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            const SizedBox(height: 16),

                            if (_summary!.categoryBreakdown.isEmpty)
                              Container(
                                padding: const EdgeInsets.all(32),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF1E293B),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Text('Chưa có chi tiêu nào trong tháng này', style: TextStyle(color: Colors.grey)),
                              )
                            else ...[
                              // Donut Chart Widget
                              SizedBox(
                                height: 220,
                                child: PieChart(
                                  PieChartData(
                                    pieTouchData: PieTouchData(
                                      touchCallback: (FlTouchEvent event, pieTouchResponse) {
                                        setState(() {
                                          if (!event.isInterestedForInteractions ||
                                              pieTouchResponse == null ||
                                              pieTouchResponse.touchedSection == null) {
                                            _touchedIndex = -1;
                                            return;
                                          }
                                          _touchedIndex = pieTouchResponse.touchedSection!.touchedSectionIndex;
                                        });
                                      },
                                    ),
                                    borderData: FlBorderData(show: false),
                                    sectionsSpace: 3,
                                    centerSpaceRadius: 45,
                                    sections: _buildPieSections(),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 20),

                              // Breakdown List
                              const Text(
                                'Chi Tiết Danh Mục',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                              const SizedBox(height: 10),

                              ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _summary!.categoryBreakdown.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 8),
                                itemBuilder: (context, index) {
                                  final item = _summary!.categoryBreakdown[index];
                                  final color = parseColor(item.categoryColor);

                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1E293B),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      children: [
                                        CircleAvatar(
                                          radius: 16,
                                          backgroundColor: color.withOpacity(0.2),
                                          child: Icon(getCategoryIconData(item.categoryIcon), color: color, size: 18),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(item.categoryName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                              const SizedBox(height: 2),
                                              Text('${item.percentage}% tổng chi', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          '${currencyFormatter.format(item.totalAmount)} VND',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ],
                          ],
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryTile(String label, double amount, Color color, NumberFormat formatter) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
            const SizedBox(height: 4),
            Text(
              '${formatter.format(amount)}',
              style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
