import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:rainingjewels_new/screens/homepage.dart';
import 'package:rainingjewels_new/services/audio_service.dart';
import 'package:rainingjewels_new/services/review_service.dart';
import 'package:rainingjewels_new/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Request notification permission for Android 13+
  await _requestNotificationPermission();

  // Initialize audio service with error handling
  try {
    await AudioService.init(
      builder: () => AudioPlayerHandler(),
      config: const AudioServiceConfig(
        androidNotificationChannelId: 'com.covaga.jewelrain.channel.audio',
        androidNotificationChannelName: 'Jewel Rain Audio',
        androidNotificationChannelDescription:
            'Audio playback controls for Jewel Rain',
        // androidNotificationOngoing has no effect while
        // androidStopForegroundOnPause is false (the library asserts on it).
        androidNotificationOngoing: false,
        androidShowNotificationBadge: true,
        androidStopForegroundOnPause: false,
        androidNotificationIcon: 'mipmap/ic_launcher',
        androidNotificationClickStartsActivity: true,
      ),
    );
  } catch (e) {
    // Continue anyway; the app still works without background audio.
    debugPrint('Error initializing audio service: $e');
  }

  runApp(const MyApp());
}

Future<void> _requestNotificationPermission() async {
  if (await Permission.notification.isDenied) {
    await Permission.notification.request();
  }
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Session counter feeds the in-app review prompts.
    ReviewService.incrementSessionCount();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    switch (state) {
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        // App is being closed or hidden: stop audio to avoid zombie playback.
        _stopAllAudio();
        break;
      case AppLifecycleState.resumed:
        _ensureNotificationVisible();
        ReviewService.requestReviewIfAppropriate();
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        // Keep audio running in the background.
        break;
    }
  }

  Future<void> _stopAllAudio() async {
    try {
      await AudioPlayerHandler.instance.stopAndDispose();
    } catch (e) {
      debugPrint('Error stopping audio service: $e');
    }
  }

  Future<void> _ensureNotificationVisible() async {
    try {
      final audioHandler = AudioPlayerHandler.instance;
      if (audioHandler.isPlaying) {
        await audioHandler.initializeIfNeeded();
      }
    } catch (e) {
      debugPrint('Error restoring notification: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Jewel Rain',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: kAccent,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: kBgBottom,
      ),
      home: const WelcomePage(),
      routes: {
        Homepage.routeName: (BuildContext ctx) => const Homepage(),
      },
    );
  }
}

class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: kBackgroundGradient),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                Flexible(
                  child: SizedBox(
                    height: MediaQuery.of(context).size.width * 0.55,
                    child: Hero(
                      tag: 'picto',
                      child: Image.asset('assets/picto.png'),
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                const Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: "Relaxing",
                        style: TextStyle(
                          color: kTextPrimary,
                          fontSize: 38.0,
                          fontWeight: FontWeight.w300,
                        ),
                      ),
                      TextSpan(
                        text: "Rain.",
                        style: TextStyle(
                          color: kTextPrimary,
                          fontSize: 38.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Ambient sounds for sleep and focus',
                  style: TextStyle(color: kTextTertiary, fontSize: 14),
                ),
                const SizedBox(height: 32),
                OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).pushNamed(Homepage.routeName);
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white, width: 2),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 40, vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  child: const Text(
                    "I want to relax",
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
