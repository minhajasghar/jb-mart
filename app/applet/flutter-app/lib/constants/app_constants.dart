import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFFDC2626); // Red 600
  static const Color primaryDark = Color(0xFFB91C1C); // Red 700
  static const Color primaryLight = Color(0xFFEF4444); // Red 500
  static const Color secondary = Color(0xFFFBBF24); // Amber
  
  static const Color background = Color(0xFF0F0F0F); // Deep dark
  static const Color surface = Color(0xFF1A1A1A);
  static const Color surfaceLight = Color(0xFF262626);
  static const Color surfaceBorder = Color(0xFF333333);
  
  static const Color textPrimary = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted = Color(0xFF6B7280);
  
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
}

class AppConstants {
  static const String appName = 'JB Mega Mart Kitchen';
  static const String defaultApiUrl = 'https://ais-dev-unje6f7zywoqak4coljsdi-849208980520.asia-southeast1.run.app';
  static const String phone = '+92 300 0000000';
  static const String address = 'JB Mega Mart, Fauji Foundation Road, Near Ishfaq Chowk Harbanspura, Lahore';
  
  static const double minOrderForDiscount = 2000.0;
  static const double discountAmount = 400.0;
  static const double codGstRate = 0.16; // 16%
  static const double onlineGstRate = 0.05; // 5%
  static const double deliveryFee = 150.0;
}
