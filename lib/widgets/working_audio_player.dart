import 'dart:async';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../services/audio_service.dart';

class WorkingAudioPlayer extends StatefulWidget {
  @override
  _WorkingAudioPlayerState createState() => _WorkingAudioPlayerState();
}

class _WorkingAudioPlayerState extends State<WorkingAudioPlayer> {
  final AudioPlayerHandler _audioHandler = AudioPlayerHandler.instance;
  bool _isPlaying = false;
  double _volume = 0.7;
  int _selectedSound = 0;
  Timer? _sleepTimer;
  int _timerMinutes = 0;
  bool _timerActive = false;
  int _remainingSeconds = 0;
  StreamSubscription<PlayerState>? _playerStateSubscription;

  final List<SoundOption> _sounds = [
    SoundOption('Rain', 'rain.mp3', '🌧️', Colors.white),
    SoundOption('Thunder', 'thunder.mp3', '⚡', Colors.grey.shade300),
    SoundOption('Wind', 'wind.mp3', '🍃', Colors.grey.shade500),
  ];

  @override
  void initState() {
    super.initState();
    _setupPlayerStateSubscription();
    _setInitialVolume();
  }

  void _setupPlayerStateSubscription() {
    // Listen to player state changes to update UI
    _playerStateSubscription = _audioHandler.playerStateStream.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state.playing;
        });
      }
    });
  }

  void _setInitialVolume() async {
    await _audioHandler.setVolume(_volume);
  }

  @override
  void dispose() {
    _sleepTimer?.cancel();
    _playerStateSubscription?.cancel();
    super.dispose();
  }


  void _changeSound(int index) async {
    // Si toca el mismo emoji que está seleccionado, toggle play/pause
    if (index == _selectedSound && _isPlaying) {
      await _audioHandler.stop();
      setState(() {
        _isPlaying = false;
      });
      return;
    }

    setState(() {
      _selectedSound = index;
    });

    // Cambiar sonido y reproducir
    try {
      String assetPath = _sounds[_selectedSound].asset;
      String title = _sounds[_selectedSound].name;

      print('Intentando reproducir: $assetPath');

      // Reproducir con AudioService (maneja todo: audio real + notificación)
      await _audioHandler.playAudio(assetPath, title);
      await _audioHandler.setVolume(_volume);

      print('Audio iniciado exitosamente');

      setState(() {
        _isPlaying = true;
      });
    } catch (e) {
      print('Error changing sound: $e');
      // Mostrar error al usuario
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al reproducir audio: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _updateVolume(double value) async {
    setState(() {
      _volume = value;
    });
    await _audioHandler.setVolume(_volume);
  }

  void _setTimer(int minutes) {
    _sleepTimer?.cancel();

    if (minutes == 0) {
      setState(() {
        _timerActive = false;
        _timerMinutes = 0;
        _remainingSeconds = 0;
      });
      return;
    }

    setState(() {
      _timerMinutes = minutes;
      _remainingSeconds = minutes * 60;
      _timerActive = true;
    });

    _sleepTimer = Timer.periodic(Duration(seconds: 1), (timer) {
      setState(() {
        _remainingSeconds--;
      });

      if (_remainingSeconds <= 0) {
        timer.cancel();
        _fadeOutAndStop();
      }
    });
  }

  void _openFAQ() async {
    _showEmailDialog();
  }

  void _showEmailDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey.shade800,
        title: Text('Contact', style: TextStyle(color: Colors.white)),
        content: Text(
          'Send your questions to:\nhello@covaga.xyz\n\nSubject: Raining Jewels - FAQ',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _fadeOutAndStop() async {
    // Fade out
    for (double vol = _volume; vol >= 0; vol -= 0.05) {
      await _audioHandler.setVolume(vol);
      await Future.delayed(Duration(milliseconds: 100));
    }

    // Stop and restore volume
    await _audioHandler.stop();
    await _audioHandler.setVolume(_volume);

    setState(() {
      _isPlaying = false;
      _timerActive = false;
      _remainingSeconds = 0;
    });
  }

  String _formatTimer() {
    int minutes = _remainingSeconds ~/ 60;
    int seconds = _remainingSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Botón FAQ
        Positioned(
          top: 50,
          right: 20,
          child: GestureDetector(
            onTap: _openFAQ,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.1),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Icon(
                Icons.help_outline,
                color: Colors.white.withOpacity(0.8),
                size: 20,
              ),
            ),
          ),
        ),

        // UI
        Column(
          children: [
            SizedBox(height: 100),

            // Selector de sonidos
            Container(
              height: 100,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(_sounds.length, (index) {
                  bool isSelected = index == _selectedSound;
                  return GestureDetector(
                    onTap: () => _changeSound(index),
                    child: Container(
                      width: isSelected ? 80 : 60,
                      height: isSelected ? 80 : 60,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(isSelected ? 0.3 : 0.1),
                        border: Border.all(
                          color: Colors.white.withOpacity(isSelected ? 0.8 : 0.3),
                          width: isSelected ? 3 : 1,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          _sounds[index].icon,
                          style: TextStyle(fontSize: isSelected ? 30 : 24),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),

            Spacer(),

            // Título
            Text(
              _sounds[_selectedSound].name,
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w300,
              ),
            ),

            SizedBox(height: 50),

            Spacer(),

            // Controles
            Container(
              margin: EdgeInsets.all(30),
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.3),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                  // Timer
                  Row(
                    children: [
                      Icon(Icons.bedtime, color: Colors.white.withOpacity(0.8), size: 20),
                      SizedBox(width: 10),
                      Text('Sleep Timer', style: TextStyle(color: Colors.white.withOpacity(0.8))),
                      Spacer(),
                      if (_timerActive)
                        Text(_formatTimer(), style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ],
                  ),

                  SizedBox(height: 15),

                  // Timer buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [0, 15, 30, 60].map((minutes) {
                      bool isSelected = _timerMinutes == minutes;
                      return GestureDetector(
                        onTap: () => _setTimer(minutes),
                        child: Container(
                          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white.withOpacity(0.3) : Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Text(
                            minutes == 0 ? 'Off' : '${minutes}m',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  SizedBox(height: 20),

                  // Volume
                  Row(
                    children: [
                      Icon(Icons.volume_down, color: Colors.white.withOpacity(0.6), size: 18),
                      Expanded(
                        child: Slider(
                          value: _volume,
                          activeColor: Colors.white,
                          inactiveColor: Colors.white.withOpacity(0.3),
                          onChanged: _updateVolume,
                        ),
                      ),
                      Icon(Icons.volume_up, color: Colors.white.withOpacity(0.6), size: 18),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class SoundOption {
  final String name;
  final String asset;
  final String icon;
  final Color color;

  SoundOption(this.name, this.asset, this.icon, this.color);
}