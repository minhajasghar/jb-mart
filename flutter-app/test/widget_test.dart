import 'package:flutter_test/flutter_test.dart';
import 'package:jb_megamart_kitchen/constants/app_constants.dart';

void main() {
  test('AppConstants configuration sanity check', () {
    expect(AppConstants.appName, 'JB Mega Mart Kitchen');
    expect(AppConstants.defaultWebAppUrl.isNotEmpty, true);
  });
}
