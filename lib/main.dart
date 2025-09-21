import 'package:flutter/material.dart';
import 'package:rainingjewels_new/screens/homepage.dart';
import 'package:audio_service/audio_service.dart';
import 'package:rainingjewels_new/services/audio_service.dart';
import 'package:permission_handler/permission_handler.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Request notification permission for Android 13+
  await _requestNotificationPermission();

  // Initialize audio service with error handling
  try {
    await AudioService.init(
      builder: () => AudioPlayerHandler(),
      config: AudioServiceConfig(
        androidNotificationChannelId: 'com.covaga.jewelrain.channel.audio',
        androidNotificationChannelName: 'Jewel Rain Audio',
        androidNotificationChannelDescription: 'Audio playback controls for Jewel Rain',
        androidNotificationOngoing: true,
        androidShowNotificationBadge: true,
        androidStopForegroundOnPause: false,
        androidNotificationIcon: 'mipmap/ic_launcher',
        androidNotificationClickStartsActivity: true,
      ),
    );
    print('Audio service initialized successfully');
  } catch (e) {
    print('Error initializing audio service: $e');
    // Continue anyway, the app should still work without background audio
  }

  runApp(MyApp());
}

Future<void> _requestNotificationPermission() async {
  // Only request permission on Android
  if (await Permission.notification.isDenied) {
    await Permission.notification.request();
  }
}

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  final _navigatorKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
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
        // App is being completely closed - stop all audio
        print('App detached - stopping all audio');
        _stopAllAudio();
        break;
      case AppLifecycleState.hidden:
        // App is hidden (could be killed) - stop audio to prevent zombie playback
        print('App hidden - stopping audio to prevent background zombie playback');
        _stopAllAudio();
        break;
      case AppLifecycleState.paused:
        // App goes to background - keep audio and notification active
        print('App paused - keeping audio service active for background playback');
        break;
      case AppLifecycleState.resumed:
        // App comes back to foreground - ensure notification is visible if audio is playing
        print('App resumed - checking audio service state');
        _ensureNotificationVisible();
        break;
      case AppLifecycleState.inactive:
        // App is inactive (e.g., during phone call) - keep audio running
        break;
    }
  }

  void _stopAllAudio() async {
    try {
      // Stop the audio handler directly (recommended approach)
      await AudioPlayerHandler.instance.stopAndDispose();
      print('Audio service stopped due to app lifecycle change');
    } catch (e) {
      print('Error stopping audio service: $e');
    }
  }

  void _ensureNotificationVisible() async {
    try {
      // Check if audio is currently playing
      final audioHandler = AudioPlayerHandler.instance;
      if (audioHandler.isPlaying) {
        // Re-initialize the audio service to restore notification
        await audioHandler.initializeIfNeeded();
        print('Audio service notification restored');
      }
    } catch (e) {
      print('Error restoring notification: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        navigatorKey: _navigatorKey,
        title: 'Jewel Rain',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
        ),
        home: MyHomePage(),
        routes: {
          Homepage.routeName: (BuildContext ctx) => Homepage(),
        },
      );
  }
}

class MyHomePage extends StatefulWidget {
  MyHomePage();

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: EdgeInsets.all(20),
        color: Colors.grey.shade800,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Flexible(
              child: Container(
                height: MediaQuery.of(context).size.width * 0.60,
                child: Hero(
                  tag: 'picto',
                  child: Image.asset('assets/picto.png'),
                ),
              ),
            ),
            Center(
                child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                      text: "Relaxing",
                      style: TextStyle(color: Colors.white, fontSize: 40.0)),
                  TextSpan(
                      text: "Rain.",
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 40.0,
                          fontWeight: FontWeight.bold))
                ],
              ),
            )),
            SizedBox(
              height: 20,
            ),
            InkWell(
              onTap: () {
                Navigator.of(context).pushNamed(Homepage.routeName);
              },
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 3),
                  borderRadius: BorderRadius.all(Radius.circular(30)),
                ),
                padding: EdgeInsets.all(15),
                child: Text(
                  "I want to relax",
                  style: TextStyle(fontSize: 20, color: Colors.white),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
