import 'package:flutter/material.dart';
import 'package:rainingjewels_new/kConstant.dart';
import 'package:rainingjewels_new/screens/homepage.dart';
import 'package:audio_service/audio_service.dart';
import 'package:rainingjewels_new/services/audio_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize audio service
  await AudioService.init(
    builder: () => AudioPlayerHandler(),
    config: AudioServiceConfig(
      androidNotificationChannelId: 'com.covaga.jewelrain.channel.audio',
      androidNotificationChannelName: 'Jewel Rain Audio',
      androidNotificationOngoing: true,
      androidShowNotificationBadge: false,
    ),
  );

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  final _navigatorKey = GlobalKey<NavigatorState>();
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    var routeName;
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
