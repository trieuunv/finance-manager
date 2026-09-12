class CategoryBreakdownItem {
  final String categoryName;
  final String categoryIcon;
  final String categoryColor;
  final double totalAmount;
  final double percentage;

  CategoryBreakdownItem({
    required this.categoryName,
    required this.categoryIcon,
    required this.categoryColor,
    required this.totalAmount,
    required this.percentage,
  });

  factory CategoryBreakdownItem.fromJson(Map<String, dynamic> json) {
    return CategoryBreakdownItem(
      categoryName: json['categoryName'] ?? '',
      categoryIcon: json['categoryIcon'] ?? 'category',
      categoryColor: json['categoryColor'] ?? '#38BDF8',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ReportSummaryModel {
  final String period;
  final int month;
  final int year;
  final double totalIncome;
  final double totalExpense;
  final double netSavings;
  final List<CategoryBreakdownItem> categoryBreakdown;

  ReportSummaryModel({
    required this.period,
    required this.month,
    required this.year,
    required this.totalIncome,
    required this.totalExpense,
    required this.netSavings,
    required this.categoryBreakdown,
  });

  factory ReportSummaryModel.fromJson(Map<String, dynamic> json) {
    var breakdownList = json['categoryBreakdown'] as List?;
    List<CategoryBreakdownItem> list = breakdownList != null
        ? breakdownList.map((i) => CategoryBreakdownItem.fromJson(i)).toList()
        : [];

    return ReportSummaryModel(
      period: json['period'] ?? '',
      month: json['month'] ?? 1,
      year: json['year'] ?? 2026,
      totalIncome: (json['totalIncome'] as num?)?.toDouble() ?? 0.0,
      totalExpense: (json['totalExpense'] as num?)?.toDouble() ?? 0.0,
      netSavings: (json['netSavings'] as num?)?.toDouble() ?? 0.0,
      categoryBreakdown: list,
    );
  }
}
