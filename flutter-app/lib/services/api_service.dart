import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';
import '../constants/app_constants.dart';

class ApiService {
  final String baseUrl;

  ApiService({this.baseUrl = AppConstants.defaultApiUrl});

  Future<List<Category>> getCategories() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/api/categories'));
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        final list = data.map((e) => Category.fromJson(e)).toList();
        list.sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
        return list;
      }
    } catch (_) {}
    return [];
  }

  Future<List<Subcategory>> getSubcategories() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/api/subcategories'));
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.map((e) => Subcategory.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  Future<List<Product>> getProducts() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/api/products'));
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.map((e) => Product.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/orders'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(orderData),
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        return jsonDecode(res.body);
      }
    } catch (_) {}
    return {'error': 'Failed to place order'};
  }

  Future<Order?> getOrder(String orderId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/api/orders/$orderId'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return Order.fromJson(data);
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'name': username, 'password': password}),
      );
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}
    return {'error': 'Invalid credentials'};
  }
}
