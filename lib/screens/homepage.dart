import 'dart:math';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:rainingjewels_new/widgets/working_audio_player.dart';
import 'package:rainingjewels_new/kConstant.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:screen_brightness/screen_brightness.dart';

class Homepage extends StatefulWidget {
  static const routeName = "/homepage";

  @override
  _HomepageState createState() => _HomepageState();
}

class _HomepageState extends State<Homepage> with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  late final Ticker _ticker;
  static AudioPlayer fixedPlayer = AudioPlayer();
  bool playState = false;
  bool _isDimmed = false;
  Timer? _dimTimer;
  double _originalBrightness = 1.0;

  @override
  void dispose() {
    _ticker.dispose();
    fixedPlayer.dispose();
    _dimTimer?.cancel();
    WakelockPlus.disable();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _ticker = this.createTicker((d) {
      setState(() {});
    })
      ..start();

    _initializeApp();
    _startDimTimer();
  }

  void _initializeApp() async {
    // Activar wakelock para mantener pantalla encendida
    WakelockPlus.enable();

    // Guardar brillo original
    try {
      _originalBrightness = await ScreenBrightness().current;
    } catch (e) {
      _originalBrightness = 1.0;
    }
  }

  void _startDimTimer() {
    _dimTimer?.cancel();
    _dimTimer = Timer(Duration(minutes: 2), () {
      _dimScreen();
    });
  }

  void _dimScreen() async {
    if (!_isDimmed) {
      setState(() {
        _isDimmed = true;
      });
      try {
        await ScreenBrightness().setScreenBrightness(0.1);
      } catch (e) {
        // Manejar error silenciosamente
      }
    }
  }

  void _restoreBrightness() async {
    if (_isDimmed) {
      setState(() {
        _isDimmed = false;
      });
      try {
        await ScreenBrightness().setScreenBrightness(_originalBrightness);
      } catch (e) {
        // Manejar error silenciosamente
      }
      _startDimTimer();
    }
  }

  @override
  void didChangeDependencies() {
    //precacheImage(_blueImage.image, context);
    super.didChangeDependencies();
  }

  @override
  Widget build(BuildContext context) {

    return GestureDetector(
      onTap: _restoreBrightness,
      onPanUpdate: (_) => _restoreBrightness(),
      child: Scaffold(
        backgroundColor: kBlueishDye,
        body: Stack(
          alignment: Alignment.center,
          fit: StackFit.expand,
          children: <Widget>[
            // Fondo blanco y negro
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black,
                    Colors.grey.shade900,
                    Colors.black,
                  ],
                ),
              ),
            ),

            // Reproductor que funciona
            WorkingAudioPlayer(),

            // Overlay de dimmer
            if (_isDimmed)
              Container(
                color: Colors.black.withOpacity(0.7),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.bedtime,
                        color: Colors.white.withOpacity(0.5),
                        size: 40,
                      ),
                      SizedBox(height: 10),
                      Text(
                        'Tap to wake',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.5),
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
    );
  }

}