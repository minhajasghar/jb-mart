import 'package:flutter/material.dart';
import '../models/models.dart';
import '../constants/app_constants.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  String _paymentMethod = 'COD';
  String _deliveryType = 'Delivery';

  List<CartItem> get items => List.unmodifiable(_items);
  String get paymentMethod => _paymentMethod;
  String get deliveryType => _deliveryType;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.totalPrice);

  double get discount => subtotal >= AppConstants.minOrderForDiscount 
      ? AppConstants.discountAmount 
      : 0.0;

  double get discountedSubtotal => (subtotal - discount).clamp(0.0, double.infinity);

  double get taxRate => _paymentMethod == 'Online' 
      ? AppConstants.onlineGstRate 
      : AppConstants.codGstRate;

  double get taxAmount => discountedSubtotal * taxRate;

  double get deliveryFee => _deliveryType == 'Delivery' ? AppConstants.deliveryFee : 0.0;

  double get total => discountedSubtotal + taxAmount + deliveryFee;

  void setPaymentMethod(String method) {
    _paymentMethod = method;
    notifyListeners();
  }

  void setDeliveryType(String type) {
    _deliveryType = type;
    notifyListeners();
  }

  void addItem(Product product, {Subcategory? subcategory, String? instructions}) {
    final existingIndex = _items.indexWhere((i) =>
        i.product.id == product.id &&
        i.selectedSubcategory?.id == subcategory?.id);

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += 1;
    } else {
      _items.add(CartItem(
        product: product,
        selectedSubcategory: subcategory,
        instructions: instructions,
        quantity: 1,
      ));
    }
    notifyListeners();
  }

  void updateQuantity(int index, int delta) {
    if (index >= 0 && index < _items.length) {
      final newQty = _items[index].quantity + delta;
      if (newQty <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = newQty;
      }
      notifyListeners();
    }
  }

  void removeItem(int index) {
    if (index >= 0 && index < _items.length) {
      _items.removeAt(index);
      notifyListeners();
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
