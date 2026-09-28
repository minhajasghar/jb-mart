import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../constants/app_constants.dart';

class WebScreen extends StatefulWidget {
  const WebScreen({super.key});

  @override
  State<WebScreen> createState() => _WebScreenState();
}

class _WebScreenState extends State<WebScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  int _loadingProgress = 0;
  bool _hasError = false;
  String _errorMessage = '';
  bool _initialLoadComplete = false;
  String _currentUrl = AppConstants.defaultWebAppUrl;
  DateTime? _lastBackPressTime;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  Future<void> _initWebView() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString(AppConstants.storageKeyCustomUrl);
    if (savedUrl != null && savedUrl.trim().isNotEmpty) {
      _currentUrl = savedUrl.trim();
    }

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.background)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) {
              setState(() {
                _loadingProgress = progress;
                if (progress >= 100) {
                  _isLoading = false;
                  _initialLoadComplete = true;
                }
              });
            }
          },
          onPageStarted: (url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
            }
          },
          onPageFinished: (url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _initialLoadComplete = true;
              });
            }
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame ?? true) {
              if (mounted) {
                setState(() {
                  _hasError = true;
                  _errorMessage = error.description;
                  _isLoading = false;
                });
              }
            }
          },
          onNavigationRequest: (request) async {
            final uri = Uri.parse(request.url);
            final scheme = uri.scheme.toLowerCase();

            // Open telephone, email, WhatsApp and maps in native device apps
            if (scheme == 'tel' ||
                scheme == 'mailto' ||
                scheme == 'sms' ||
                scheme == 'whatsapp' ||
                request.url.contains('wa.me') ||
                request.url.contains('api.whatsapp.com') ||
                request.url.contains('maps.google.com') ||
                scheme == 'geo') {
              try {
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                  return NavigationDecision.prevent;
                }
              } catch (_) {}
            }
            return NavigationDecision.navigate;
          },
        ),
      );

    _loadCurrentUrl();
  }

  void _loadCurrentUrl() {
    setState(() {
      _hasError = false;
      _isLoading = true;
    });
    _controller.loadRequest(Uri.parse(_currentUrl));
  }

  Future<void> _changeServerUrl(String newUrl) async {
    final clean = newUrl.trim();
    if (clean.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.storageKeyCustomUrl, clean);
    setState(() {
      _currentUrl = clean;
    });
    _loadCurrentUrl();
  }

  void _showUrlSettingsDialog() {
    final controller = TextEditingController(text: _currentUrl);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Server Configuration',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.textSecondary),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Enter the web application URL. You can use your deployed domain or local machine IP (e.g. http://192.168.1.x:5000) during testing.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                autofocus: true,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Web App URL',
                  labelStyle: const TextStyle(color: AppColors.textSecondary),
                  hintText: 'https://your-domain.com or http://10.0.2.2:5000',
                  hintStyle: const TextStyle(color: AppColors.textMuted),
                  prefixIcon: const Icon(Icons.link, color: AppColors.primary),
                  filled: true,
                  fillColor: AppColors.surfaceLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.surfaceBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.surfaceBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ActionChip(
                    backgroundColor: AppColors.surfaceLight,
                    side: const BorderSide(color: AppColors.surfaceBorder),
                    label: const Text('Live Server (kitchen.jbmegamart.com)', style: TextStyle(fontSize: 12, color: Colors.white)),
                    onPressed: () {
                      controller.text = AppConstants.defaultWebAppUrl;
                    },
                  ),
                  ActionChip(
                    backgroundColor: AppColors.surfaceLight,
                    side: const BorderSide(color: AppColors.surfaceBorder),
                    label: const Text('Android Emulator (10.0.2.2:5000)', style: TextStyle(fontSize: 12, color: Colors.white)),
                    onPressed: () {
                      controller.text = AppConstants.localEmulatorUrl;
                    },
                  ),
                  ActionChip(
                    backgroundColor: AppColors.surfaceLight,
                    side: const BorderSide(color: AppColors.surfaceBorder),
                    label: const Text('Localhost (localhost:5000)', style: TextStyle(fontSize: 12, color: Colors.white)),
                    onPressed: () {
                      controller.text = AppConstants.localhostUrl;
                    },
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    final target = controller.text.trim();
                    if (target.isNotEmpty) {
                      Navigator.pop(ctx);
                      _changeServerUrl(target);
                    }
                  },
                  child: const Text('Save & Reload', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handlePopScope(bool didPop) async {
    if (didPop) return;

    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return;
    }

    final now = DateTime.now();
    if (_lastBackPressTime == null || now.difference(_lastBackPressTime!) > const Duration(seconds: 2)) {
      _lastBackPressTime = now;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Press back again to exit'),
            duration: Duration(seconds: 2),
            backgroundColor: AppColors.surfaceLight,
          ),
        );
      }
      return;
    }

    SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: AppColors.background,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) => _handlePopScope(didPop),
        child: Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            bottom: false,
            child: Stack(
              children: [
                // Error Screen
                if (_hasError)
                  _buildErrorView()
                else
                  // WebView with Pull-To-Refresh
                  RefreshIndicator(
                    color: AppColors.primary,
                    backgroundColor: AppColors.surface,
                    onRefresh: () async {
                      await _controller.reload();
                    },
                    child: WebViewWidget(controller: _controller),
                  ),

                // Top Loading Linear Indicator
                if (_isLoading && !_hasError)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: LinearProgressIndicator(
                      value: _loadingProgress > 0 ? _loadingProgress / 100 : null,
                      backgroundColor: Colors.transparent,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      minHeight: 2.5,
                    ),
                  ),

                // Initial Startup Splash Screen with Brand Logo
                if (!_initialLoadComplete && !_hasError)
                  _buildSplashScreen(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSplashScreen() {
    return Container(
      color: AppColors.background,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 140,
              height: 140,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.surfaceBorder, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(50),
                    blurRadius: 30,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/JBMM.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              AppConstants.appName,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Shop Smart. Live Better',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 32),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.surfaceBorder, width: 2),
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/JBMM.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Connection Error',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              _errorMessage.isNotEmpty
                  ? _errorMessage
                  : 'Unable to connect to the JB Mega Mart web application.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.surfaceBorder),
              ),
              child: Text(
                _currentUrl,
                style: const TextStyle(
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: AppColors.textMuted,
                ),
              ),
            ),
            const SizedBox(height: 28),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _loadCurrentUrl,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Retry', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: AppColors.surfaceBorder),
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _showUrlSettingsDialog,
                  icon: const Icon(Icons.settings, size: 18),
                  label: const Text('Change URL'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
