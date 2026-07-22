import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:rainingjewels_new/screens/homepage.dart';
import 'package:rainingjewels_new/services/audio_service.dart';
import 'package:rainingjewels_new/services/review_service.dart';

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
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: Colors.black,
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
      body: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(20),
          color: Colors.grey.shade800,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              Flexible(
                child: SizedBox(
                  height: MediaQuery.of(context).size.width * 0.60,
                  child: Hero(
                    tag: 'picto',
                    child: Image.asset('assets/picto.png'),
                  ),
                ),
              ),
              const Center(
                child: Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: "Relaxing",
                        style: TextStyle(color: Colors.white, fontSize: 40.0),
                      ),
                      TextSpan(
                        text: "Rain.",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 40.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              InkWell(
                onTap: () {
                  Navigator.of(context).pushNamed(Homepage.routeName);
                },
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white, width: 3),
                    borderRadius: const BorderRadius.all(Radius.circular(30)),
                  ),
                  padding: const EdgeInsets.all(15),
                  child: const Text(
                    "I want to relax",
                    style: TextStyle(fontSize: 20, color: Colors.white),
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
