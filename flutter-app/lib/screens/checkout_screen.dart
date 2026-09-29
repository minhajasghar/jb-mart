import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/cart_provider.dart';
import '../services/api_service.dart';
import '../constants/app_constants.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final ApiService _api = ApiService();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submitOrder(CartProvider cart) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final orderData = {
      'customerName': _nameController.text.trim(),
      'customerPhone': _phoneController.text.trim(),
      'address': _addressController.text.trim(),
      'paymentMethod': cart.paymentMethod,
      'deliveryType': cart.deliveryType,
      'items': cart.items.map((i) => i.toJson()).toList(),
      'total': cart.total,
      'taxAmount': cart.taxAmount,
      'taxRate': cart.taxRate,
      'subtotal': cart.subtotal,
      'discount': cart.discount,
      'deliveryFee': cart.deliveryFee,
    };

    final res = await _api.createOrder(orderData);
    setState(() => _isSubmitting = false);

    if (res['orderId'] != null || res['id'] != null) {
      final orderId = res['orderId'] ?? res['id'];
      cart.clearCart();
      if (!mounted) return;

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: AppColors.success),
              SizedBox(width: 8),
              Text('Order Placed!'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Your Order ID is #$orderId'),
              const SizedBox(height: 8),
              const Text('Our kitchen has received your order and will begin preparing it shortly.'),
            ],
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: () {
                Navigator.of(ctx).popUntil((route) => route.isFirst);
              },
              child: const Text('Back to Home', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['error'] ?? 'Failed to submit order. Please try again.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  /// Shows a confirm dialog before removing an item from the order.
  void _confirmRemove(
      BuildContext context, CartProvider cart, int index, String itemName) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Remove Item?'),
        content: Text('Remove "$itemName" from your order?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () {
              Navigator.pop(ctx);
              cart.removeItem(index);
            },
            child:
                const Text('Remove', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    // ── Empty-cart graceful state ────────────────────────────────────────
    if (cart.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.surfaceBorder, width: 2),
                  ),
                  child: const Icon(
                    Icons.shopping_cart_outlined,
                    size: 56,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Your order is empty',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'You removed all items. Head back to add something delicious!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: AppColors.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 28, vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.restaurant_menu),
                  label: const Text('Back to Menu',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  onPressed: () =>
                      Navigator.of(context).popUntil((route) => route.isFirst),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Order Items with quantity controls ─────────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Text(
                    'Your Order',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${cart.itemCount} ${cart.itemCount == 1 ? "Item" : "Items"}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.surfaceBorder),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: cart.items.length,
                  separatorBuilder: (_, __) =>
                      const Divider(height: 1, color: AppColors.surfaceBorder),
                  itemBuilder: (context, index) {
                    final item = cart.items[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Item name + variant + price
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.product.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                if (item.selectedSubcategory != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    item.selectedSubcategory!.name,
                                    style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12),
                                  ),
                                ],
                                const SizedBox(height: 4),
                                Text(
                                  'Rs. ${item.totalPrice.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    color: AppColors.primaryLight,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // −  qty  + stepper pill
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: AppColors.surfaceBorder),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Decrement (shows delete icon when qty == 1)
                                InkWell(
                                  borderRadius: const BorderRadius.horizontal(
                                      left: Radius.circular(24)),
                                  onTap: () {
                                    if (item.quantity > 1) {
                                      cart.updateQuantity(index, -1);
                                    } else {
                                      _confirmRemove(context, cart, index,
                                          item.product.name);
                                    }
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 6),
                                    child: Icon(
                                      item.quantity > 1
                                          ? Icons.remove
                                          : Icons.delete_outline,
                                      size: 18,
                                      color: item.quantity > 1
                                          ? AppColors.textSecondary
                                          : AppColors.error,
                                    ),
                                  ),
                                ),

                                // Quantity display
                                Padding(
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 6),
                                  child: Text(
                                    '${item.quantity}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),

                                // Increment
                                InkWell(
                                  borderRadius: const BorderRadius.horizontal(
                                      right: Radius.circular(24)),
                                  onTap: () => cart.updateQuantity(index, 1),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 6),
                                    child: Icon(Icons.add,
                                        size: 18,
                                        color: AppColors.primaryLight),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Dedicated trash icon button
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () => _confirmRemove(
                                context, cart, index, item.product.name),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.error.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.delete_outline,
                                size: 18,
                                color: AppColors.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),

              // ── Customer Details ───────────────────────────────────────
              const Text(
                'Customer Details',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: const Icon(Icons.person),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) => val == null || val.trim().isEmpty
                    ? 'Enter your name'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Phone Number (e.g. 03001234567)',
                  prefixIcon: const Icon(Icons.phone),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) => val == null || val.trim().isEmpty
                    ? 'Enter your phone number'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _addressController,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: 'Delivery Address',
                  prefixIcon: const Icon(Icons.location_on),
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) => val == null || val.trim().isEmpty
                    ? 'Enter your address'
                    : null,
              ),
              const SizedBox(height: 24),

              // ── Payment Method ─────────────────────────────────────────
              const Text(
                'Payment Method',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(
                          child: Text('Cash on Delivery\n(16% GST)',
                              textAlign: TextAlign.center)),
                      selected: cart.paymentMethod == 'COD',
                      selectedColor: AppColors.primary,
                      onSelected: (_) => cart.setPaymentMethod('COD'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(
                          child: Text('Online / Card\n(5% GST Discount)',
                              textAlign: TextAlign.center)),
                      selected: cart.paymentMethod == 'Online',
                      selectedColor: AppColors.primary,
                      onSelected: (_) => cart.setPaymentMethod('Online'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Live Price Summary ────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.surfaceBorder),
                ),
                child: Column(
                  children: [
                    _summaryRow('Items Total',
                        'Rs. ${cart.subtotal.toStringAsFixed(0)}'),
                    if (cart.discount > 0) ...[
                      const SizedBox(height: 6),
                      _summaryRow(
                        'Discount Promo',
                        '- Rs. ${cart.discount.toStringAsFixed(0)}',
                        color: AppColors.success,
                      ),
                    ],
                    const SizedBox(height: 6),
                    _summaryRow(
                      'GST (${(cart.taxRate * 100).toInt()}%)',
                      'Rs. ${cart.taxAmount.toStringAsFixed(0)}',
                    ),
                    const SizedBox(height: 6),
                    _summaryRow('Delivery Fee',
                        'Rs. ${cart.deliveryFee.toStringAsFixed(0)}'),
                    const Divider(height: 20, color: AppColors.surfaceBorder),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total to Pay',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16)),
                        Text(
                          'Rs. ${cart.total.toStringAsFixed(0)}',
                          style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: AppColors.primaryLight),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: _isSubmitting ? null : () => _submitOrder(cart),
                  child: _isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Confirm & Place Order',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Helper to render a price-summary row with optional colour override.
  Widget _summaryRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: color != null ? TextStyle(color: color) : null),
        Text(value,
            style: color != null ? TextStyle(color: color) : null),
      ],
    );
  }
}
