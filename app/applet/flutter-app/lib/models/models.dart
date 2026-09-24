class Category {
  final String id;
  final String name;
  final int displayOrder;
  final String? image;
  final bool hasSubcategories;

  Category({
    required this.id,
    required this.name,
    this.displayOrder = 0,
    this.image,
    this.hasSubcategories = false,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      displayOrder: json['display_order'] ?? json['displayOrder'] ?? 0,
      image: json['image'],
      hasSubcategories: json['has_subcategories'] == 1 || json['hasSubcategories'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'displayOrder': displayOrder,
    'image': image,
    'hasSubcategories': hasSubcategories,
  };
}

class Subcategory {
  final String id;
  final String categoryId;
  final String name;
  final bool required;
  final double priceAdjustment;
  final double? price;
  final int displayOrder;
  final String? image;

  Subcategory({
    required this.id,
    required this.categoryId,
    required this.name,
    this.required = false,
    this.priceAdjustment = 0.0,
    this.price,
    this.displayOrder = 0,
    this.image,
  });

  factory Subcategory.fromJson(Map<String, dynamic> json) {
    return Subcategory(
      id: json['id'] ?? '',
      categoryId: json['category_id'] ?? json['categoryId'] ?? '',
      name: json['name'] ?? '',
      required: json['required'] == 1 || json['required'] == true,
      priceAdjustment: (json['price_adjustment'] ?? json['priceAdjustment'] ?? 0.0).toDouble(),
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
      displayOrder: json['display_order'] ?? json['displayOrder'] ?? 0,
      image: json['image'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'categoryId': categoryId,
    'name': name,
    'required': required,
    'priceAdjustment': priceAdjustment,
    'price': price,
    'displayOrder': displayOrder,
    'image': image,
  };
}

class Product {
  final String id;
  final String name;
  final double? price;
  final double? costPrice;
  final String? image;
  final String? variant;
  final String? categoryId;
  final String? subcategoryId;
  final bool isOutOfStock;
  final bool isSpecial;
  final List<String> subcategoryIds;

  Product({
    required this.id,
    required this.name,
    this.price,
    this.costPrice,
    this.image,
    this.variant,
    this.categoryId,
    this.subcategoryId,
    this.isOutOfStock = false,
    this.isSpecial = false,
    this.subcategoryIds = const [],
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    List<String> subIds = [];
    if (json['subcategory_ids'] is List) {
      subIds = List<String>.from(json['subcategory_ids']);
    } else if (json['subcategoryIds'] is List) {
      subIds = List<String>.from(json['subcategoryIds']);
    }

    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
      costPrice: json['cost_price'] != null ? (json['cost_price'] as num).toDouble() : null,
      image: json['image'],
      variant: json['variant'],
      categoryId: json['category_id'] ?? json['categoryId'],
      subcategoryId: json['subcategory_id'] ?? json['subcategoryId'],
      isOutOfStock: json['is_out_of_stock'] == 1 || json['isOutOfStock'] == true,
      isSpecial: json['is_special'] == 1 || json['isSpecial'] == true,
      subcategoryIds: subIds,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'price': price,
    'costPrice': costPrice,
    'image': image,
    'variant': variant,
    'categoryId': categoryId,
    'subcategoryId': subcategoryId,
    'isOutOfStock': isOutOfStock,
    'isSpecial': isSpecial,
    'subcategoryIds': subcategoryIds,
  };
}

class CartItem {
  final Product product;
  int quantity;
  String? instructions;
  final Subcategory? selectedSubcategory;

  CartItem({
    required this.product,
    this.quantity = 1,
    this.instructions,
    this.selectedSubcategory,
  });

  double get unitPrice {
    if (selectedSubcategory?.price != null) {
      return selectedSubcategory!.price!;
    }
    double base = product.price ?? 0.0;
    if (selectedSubcategory != null) {
      base += selectedSubcategory!.priceAdjustment;
    }
    return base;
  }

  double get totalPrice => unitPrice * quantity;

  Map<String, dynamic> toJson() => {
    'id': product.id,
    'name': product.name,
    'price': unitPrice,
    'quantity': quantity,
    'instructions': instructions,
    'selectedSubcategoryId': selectedSubcategory?.id,
    'selectedSubcategoryName': selectedSubcategory?.name,
  };
}

class Order {
  final String id;
  final String customerName;
  final String customerPhone;
  final String address;
  final List<CartItem> items;
  final double total;
  final double totalCost;
  final double profit;
  final String status;
  final String paymentMethod;
  final double taxAmount;
  final double taxRate;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    required this.address,
    required this.items,
    required this.total,
    this.totalCost = 0.0,
    this.profit = 0.0,
    required this.status,
    required this.paymentMethod,
    this.taxAmount = 0.0,
    this.taxRate = 0.16,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? '',
      customerName: json['customer_name'] ?? json['customerName'] ?? '',
      customerPhone: json['customer_phone'] ?? json['customerPhone'] ?? '',
      address: json['address'] ?? '',
      items: [],
      total: (json['total'] ?? 0.0).toDouble(),
      totalCost: (json['total_cost'] ?? json['totalCost'] ?? 0.0).toDouble(),
      profit: (json['profit'] ?? 0.0).toDouble(),
      status: json['status'] ?? 'Pending',
      paymentMethod: json['payment_method'] ?? json['paymentMethod'] ?? 'COD',
      taxAmount: (json['tax_amount'] ?? json['taxAmount'] ?? 0.0).toDouble(),
      taxRate: (json['tax_rate'] ?? json['taxRate'] ?? 0.16).toDouble(),
      createdAt: json['created_at'] != null 
          ? DateTime.tryParse(json['created_at']) ?? DateTime.now() 
          : DateTime.now(),
    );
  }
}
