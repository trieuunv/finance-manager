class CategoryModel {
  final String id;
  final String? userId;
  final String name;
  final String icon;
  final String color;
  final String type; // EXPENSE, INCOME
  final String? parentId;
  final bool isDefault;
  final List<CategoryModel> subCategories;

  CategoryModel({
    required this.id,
    this.userId,
    required this.name,
    required this.icon,
    required this.color,
    required this.type,
    this.parentId,
    required this.isDefault,
    this.subCategories = const [],
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    var subsJson = json['subCategories'] as List?;
    List<CategoryModel> subsList = subsJson != null
        ? subsJson.map((i) => CategoryModel.fromJson(i)).toList()
        : [];

    return CategoryModel(
      id: json['id'] ?? '',
      userId: json['userId'],
      name: json['name'] ?? '',
      icon: json['icon'] ?? 'category',
      color: json['color'] ?? '#38BDF8',
      type: json['type'] ?? 'EXPENSE',
      parentId: json['parentId'],
      isDefault: json['isDefault'] ?? false,
      subCategories: subsList,
    );
  }
}
