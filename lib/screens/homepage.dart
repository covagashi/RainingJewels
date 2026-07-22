import 'dart:async';

import 'package:flutter/material.dart';
import 'package:rainingjewels_new/theme.dart';
import 'package:rainingjewels_new/widgets/sound_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:screen_brightness/screen_brightness.dart';

class Homepage extends StatefulWidget {
  static const routeName = "/homepage";

  const Homepage({super.key});

  @override
  State<Homepage> createState() => _HomepageState();
}

class _HomepageState extends State<Homepage> {
  bool _isDimmed = false;
  Timer? _dimTimer;

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable();
    _startDimTimer();
  }

  @override
  void dispose() {
    _dimTimer?.cancel();
    WakelockPlus.disable();
    if (_isDimmed) {
      // Fire-and-forget: restore system-controlled brightness on exit.
      ScreenBrightness().resetApplicationScreenBrightness().catchError((e) {
        debugPrint('Error restoring brightness: $e');
      });
    }
    super.dispose();
  }

  void _startDimTimer() {
    _dimTimer?.cancel();
    _dimTimer = Timer(const Duration(minutes: 2), _dimScreen);
  }

  Future<void> _dimScreen() async {
    if (_isDimmed) return;
    setState(() => _isDimmed = true);
    try {
      await ScreenBrightness().setApplicationScreenBrightness(0.1);
    } catch (e) {
      debugPrint('Error dimming screen: $e');
    }
  }

  Future<void> _restoreBrightness() async {
    if (!_isDimmed) return;
    setState(() => _isDimmed = false);
    try {
      await ScreenBrightness().resetApplicationScreenBrightness();
    } catch (e) {
      debugPrint('Error restoring brightness: $e');
    }
    _startDimTimer();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _restoreBrightness,
      onPanUpdate: (_) => _restoreBrightness(),
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            alignment: Alignment.center,
            fit: StackFit.expand,
            children: <Widget>[
              Container(
                decoration: const BoxDecoration(gradient: kBackgroundGradient),
              ),
              const SoundPlayer(),
              if (_isDimmed)
                Container(
                  color: Colors.black.withValues(alpha: 0.7),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.bedtime,
                          color: Colors.white.withValues(alpha: 0.5),
                          size: 40,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Tap to wake',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
