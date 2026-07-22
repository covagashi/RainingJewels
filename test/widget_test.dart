import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:rainingjewels_new/main.dart';

void main() {
  testWidgets('App launches and shows the relax button', (tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const MyApp());

    expect(find.text('I want to relax'), findsOneWidget);
  });
}
