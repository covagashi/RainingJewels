import 'dart:async';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';

class SleepTimer extends StatefulWidget {
  final AudioPlayer audioPlayer;
  final VoidCallback? onTimerComplete;

  const SleepTimer({
    Key? key,
    required this.audioPlayer,
    this.onTimerComplete,
  }) : super(key: key);

  @override
  _SleepTimerState createState() => _SleepTimerState();
}

class _SleepTimerState extends State<SleepTimer> with TickerProviderStateMixin {
  Timer? _timer;
  int _remainingSeconds = 0;
  bool _isTimerActive = false;
  late AnimationController _pulseController;

  final List<int> _timerOptions = [
    0, // Off
    5 * 60, // 5 minutes
    15 * 60, // 15 minutes
    30 * 60, // 30 minutes
    60 * 60, // 1 hour
    120 * 60, // 2 hours
  ];

  final List<String> _timerLabels = [
    'Off',
    '5m',
    '15m',
    '30m',
    '1h',
    '2h',
  ];

  int _selectedTimerIndex = 0;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startTimer() {
    if (_selectedTimerIndex == 0) return;

    _timer?.cancel();
    _remainingSeconds = _timerOptions[_selectedTimerIndex];
    _isTimerActive = true;

    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      setState(() {
        _remainingSeconds--;
      });

      if (_remainingSeconds <= 0) {
        _stopTimer();
        _fadeOutAudio();
      }
    });

    setState(() {});
  }

  void _stopTimer() {
    _timer?.cancel();
    _isTimerActive = false;
    _remainingSeconds = 0;
    widget.onTimerComplete?.call();
    setState(() {});
  }

  void _fadeOutAudio() async {
    // Fade out gradual del audio
    for (double volume = 1.0; volume >= 0; volume -= 0.1) {
      await widget.audioPlayer.setVolume(volume);
      await Future.delayed(Duration(milliseconds: 200));
    }
    await widget.audioPlayer.stop();
    await widget.audioPlayer.setVolume(1.0);
  }

  String _formatTime(int seconds) {
    int hours = seconds ~/ 3600;
    int minutes = (seconds % 3600) ~/ 60;
    int secs = seconds % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    } else {
      return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 60,
      right: 20,
      child: Material(
        color: Colors.transparent,
        child: Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.15),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Timer display
              if (_isTimerActive)
                AnimatedBuilder(
                  animation: _pulseController,
                  builder: (context, child) {
                    return Container(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      margin: EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _formatTime(_remainingSeconds),
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    );
                  },
                ),

              // Sleep icon
              Icon(
                Icons.bedtime_outlined,
                color: Colors.white.withOpacity(0.9),
                size: 24,
              ),

              SizedBox(height: 8),

              // Timer options
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: List.generate(_timerLabels.length, (index) {
                  bool isSelected = _selectedTimerIndex == index;
                  bool isOff = index == 0;

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        if (_isTimerActive) {
                          _stopTimer();
                        }
                        _selectedTimerIndex = index;
                        if (!isOff) {
                          _startTimer();
                        }
                      });
                    },
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected
                          ? Colors.white.withOpacity(0.25)
                          : Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: isSelected ? Border.all(
                          color: Colors.white.withOpacity(0.4),
                          width: 1,
                        ) : null,
                      ),
                      child: Text(
                        _timerLabels[index],
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }
}