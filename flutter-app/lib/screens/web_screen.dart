import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
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
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  bool _isLoading = true;
  int _loadingProgress = 0;
  bool _isOffline = false;
  bool _isRetrying = false;
  bool _initialLoadComplete = false;
  String _currentUrl = AppConstants.defaultWebAppUrl;
  DateTime? _lastBackPressTime;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    super.dispose();
  }

  bool _isOfflineFromResults(List<ConnectivityResult> results) {
    if (results.isEmpty) return true;
    return results.every((r) => r == ConnectivityResult.none);
  }

  Future<bool> _checkInternetConnection() async {
    try {
      final results = await _connectivity.checkConnectivity();
      if (_isOfflineFromResults(results)) {
        return false;
      }

      // Verify active reachability with a fast DNS lookup
      try {
        final uri = Uri.tryParse(_currentUrl);
        final host = (uri != null && uri.host.isNotEmpty) ? uri.host : 'kitchen.jbmegamart.com';
        // Allow local dev/emulator host without external DNS check
        if (host == 'localhost' || host == '10.0.2.2' || host.startsWith('192.168.') || host.startsWith('127.')) {
          return true;
        }

        final lookup = await InternetAddress.lookup(host).timeout(const Duration(seconds: 3));
        return lookup.isNotEmpty && lookup[0].rawAddress.isNotEmpty;
      } catch (_) {
        // Fallback to check general internet reachability
        try {
          final fallback = await InternetAddress.lookup('one.one.one.one').timeout(const Duration(seconds: 2));
          return fallback.isNotEmpty && fallback[0].rawAddress.isNotEmpty;
        } catch (_) {
          return false;
        }
      }
    } catch (_) {
      return false;
    }
  }

  Future<void> _initWebView() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString(AppConstants.storageKeyCustomUrl);
    if (savedUrl != null && savedUrl.trim().isNotEmpty) {
      _currentUrl = savedUrl.trim();
    }

    // Monitor connectivity changes at runtime
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((results) {
      final isOffline = _isOfflineFromResults(results);
      if (!isOffline && _isOffline && mounted) {
        // Auto-retry when connection is re-established
        _retryConnection();
      }
    });

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
              });
            }
          },
          onPageFinished: (url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _isOffline = false;
                _initialLoadComplete = true;
              });
            }
          },
          onWebResourceError: (error) {
            // When a network/loading error occurs, display the offline screen
            // instead of the default browser error page
            if (error.isForMainFrame ?? true) {
              if (mounted) {
                setState(() {
                  _isOffline = true;
                  _isLoading = false;
                  _initialLoadComplete = true;
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

    await _loadCurrentUrl();
  }

  Future<void> _loadCurrentUrl() async {
    final hasInternet = await _checkInternetConnection();
    if (!mounted) return;

    if (!hasInternet) {
      setState(() {
        _isOffline = true;
        _isLoading = false;
        _initialLoadComplete = true;
      });
      return;
    }

    setState(() {
      _isOffline = false;
      _isLoading = true;
    });

    final target = _currentUrl.isNotEmpty ? _currentUrl : AppConstants.defaultWebAppUrl;
    _controller.loadRequest(Uri.parse(target));
  }

  Future<void> _retryConnection() async {
    if (_isRetrying) return;
    setState(() {
      _isRetrying = true;
    });

    final bool connected = await _checkInternetConnection();

    if (!mounted) return;

    if (connected) {
      setState(() {
        _isOffline = false;
        _isLoading = true;
        _isRetrying = false;
      });
      final target = _currentUrl.isNotEmpty ? _currentUrl : AppConstants.defaultWebAppUrl;
      _controller.loadRequest(Uri.parse(target));
    } else {
      setState(() {
        _isRetrying = false;
      });

      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Still no connection. Please check your Wi-Fi or mobile data.',
            style: TextStyle(color: Colors.white, fontSize: 13),
          ),
          backgroundColor: AppColors.surfaceLight,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _changeServerUrl(String newUrl) async {
    final clean = newUrl.trim();
    if (clean.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.storageKeyCustomUrl, clean);
    setState(() {
      _currentUrl = clean;
    });
    await _loadCurrentUrl();
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

    if (!_isOffline && await _controller.canGoBack()) {
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
                // Active WebView with Pull-To-Refresh when online
                if (!_isOffline)
                  RefreshIndicator(
                    color: AppColors.primary,
                    backgroundColor: AppColors.surface,
                    onRefresh: () async {
                      await _controller.reload();
                    },
                    child: WebViewWidget(controller: _controller),
                  ),

                // Top Loading Linear Indicator
                if (_isLoading && !_isOffline)
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

                // Clean dark theme offline / no internet screen
                if (_isOffline)
                  _buildOfflineView(),

                // Initial Startup Splash Screen with Brand Logo
                if (!_initialLoadComplete && !_isOffline)
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

  Widget _buildOfflineView() {
    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.surface,
      onRefresh: _retryConnection,
      child: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight,
              ),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Subtle Wi-Fi off icon (in red or white)
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.surfaceBorder,
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withAlpha(30),
                              blurRadius: 28,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.wifi_off_rounded,
                            size: 44,
                            color: AppColors.primaryLight,
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Title: 'No Internet Connection' in bold white text
                      const Text(
                        'No Internet Connection',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Subtitle: in muted grey text
                      const Text(
                        'This app requires an active internet connection to browse the menu and place orders.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.5,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Red rounded 'Retry' button
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 42,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(28),
                          ),
                          elevation: 3,
                          shadowColor: AppColors.primary.withAlpha(90),
                        ),
                        onPressed: _isRetrying ? null : _retryConnection,
                        child: _isRetrying
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Retry',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.3,
                                ),
                              ),
                      ),
                      const SizedBox(height: 24),

                      // Server URL configuration for developer/testing convenience
                      TextButton.icon(
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.textMuted,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        ),
                        onPressed: _showUrlSettingsDialog,
                        icon: const Icon(Icons.settings_outlined, size: 16),
                        label: const Text(
                          'Server Settings',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
