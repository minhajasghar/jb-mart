import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFFDC2626); // Red 600
  static const Color primaryDark = Color(0xFFB91C1C); // Red 700
  static const Color primaryLight = Color(0xFFEF4444); // Red 500
  static const Color secondary = Color(0xFFFBBF24); // Amber
  static const Color accentGold = Color(0xFFFBBF24); // Amber
  
  static const Color background = Color(0xFF0F0F0F); // Deep dark
  static const Color surface = Color(0xFF18181B);
  static const Color surfaceLight = Color(0xFF27272A);
  static const Color surfaceBorder = Color(0xFF3F3F46);
  
  static const Color textPrimary = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted = Color(0xFF71717A);
  
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
}

class AppConstants {
  static const String appName = 'JB Mega Mart Kitchen';
  
  // Default live production URL of the deployed server & web application.
  static const String defaultWebAppUrl = 'https://kitchen.jbmegamart.com';
  static const String defaultApiUrl = 'https://kitchen.jbmegamart.com';
  static const String localEmulatorUrl = 'http://10.0.2.2:5000';
  static const String localhostUrl = 'http://localhost:5000';
  
  static const String storageKeyCustomUrl = 'jb_mart_custom_web_url';
  
  static const String phone = '+92 300 0000000';
  static const String address = 'JB Mega Mart, Fauji Foundation Road, Near Ishfaq Chowk Harbanspura, Lahore';

  // Business logic rates & limits
  static const double minOrderForDiscount = 2000.0;
  static const double discountAmount = 400.0;
  static const double codGstRate = 0.16; // 16% Punjab Sales Tax
  static const double onlineGstRate = 0.05; // 5% reduced GST for digital payment
  static const double deliveryFee = 150.0;
}
