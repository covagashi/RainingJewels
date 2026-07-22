import 'dart:async';

import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import '../models/sound.dart';
import '../services/audio_service.dart';
import 'sound_credits_sheet.dart';

/// Main player UI: featured sounds, the "More sounds" section, sleep timer
/// and volume controls.
class SoundPlayer extends StatefulWidget {
  const SoundPlayer({super.key});

  @override
  State<SoundPlayer> createState() => _SoundPlayerState();
}

class _SoundPlayerState extends State<SoundPlayer> {
  final AudioPlayerHandler _audioHandler = AudioPlayerHandler.instance;
  bool _isPlaying = false;
  double _volume = 0.7;
  int _selectedIndex = 0;
  Timer? _sleepTimer;
  int _timerMinutes = 0;
  bool _timerActive = false;
  int _remainingSeconds = 0;
  StreamSubscription<PlayerState>? _playerStateSubscription;

  Sound get _selectedSound => kAllSounds[_selectedIndex];

  @override
  void initState() {
    super.initState();
    _playerStateSubscription = _audioHandler.playerStateStream.listen((state) {
      if (mounted) {
        setState(() => _isPlaying = state.playing);
      }
    });
    _audioHandler.setVolume(_volume);
  }

  @override
  void dispose() {
    _sleepTimer?.cancel();
    _playerStateSubscription?.cancel();
    super.dispose();
  }

  Future<void> _onSoundTap(int index) async {
    // Tapping the selected sound while playing toggles it off.
    if (index == _selectedIndex && _isPlaying) {
      await _audioHandler.stop();
      if (mounted) setState(() => _isPlaying = false);
      return;
    }

    setState(() => _selectedIndex = index);

    try {
      final sound = kAllSounds[index];
      await _audioHandler.playAudio(sound.asset, sound.name);
      await _audioHandler.setVolume(_volume);
      if (mounted) setState(() => _isPlaying = true);
    } catch (e) {
      debugPrint('Error changing sound: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not play audio: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
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

    _sleepTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _remainingSeconds--);
      if (_remainingSeconds <= 0) {
        timer.cancel();
        _fadeOutAndStop();
      }
    });
  }

  Future<void> _fadeOutAndStop() async {
    for (double vol = _volume; vol >= 0; vol -= 0.05) {
      await _audioHandler.setVolume(vol);
      await Future.delayed(const Duration(milliseconds: 100));
    }
    await _audioHandler.stop();
    await _audioHandler.setVolume(_volume);

    if (mounted) {
      setState(() {
        _isPlaying = false;
        _timerActive = false;
        _remainingSeconds = 0;
      });
    }
  }

  String _formatTimer() {
    final minutes = _remainingSeconds ~/ 60;
    final seconds = _remainingSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  void _showInfoSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.grey.shade900,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.email_outlined, color: Colors.white70),
              title: const Text('Contact', style: TextStyle(color: Colors.white)),
              subtitle: const Text(
                'hello@covaga.xyz — Subject: Raining Jewels - FAQ',
                style: TextStyle(color: Colors.white54),
              ),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.library_music_outlined, color: Colors.white70),
              title: const Text('Sound credits', style: TextStyle(color: Colors.white)),
              subtitle: const Text(
                'Licenses and authors of the bundled sounds',
                style: TextStyle(color: Colors.white54),
              ),
              onTap: () {
                Navigator.pop(context);
                showSoundCreditsSheet(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          top: 10,
          right: 20,
          child: IconButton(
            onPressed: _showInfoSheet,
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withValues(alpha: 0.1),
              side: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
            ),
            icon: Icon(
              Icons.help_outline,
              color: Colors.white.withValues(alpha: 0.8),
              size: 20,
            ),
          ),
        ),
        Column(
          children: [
            const SizedBox(height: 70),

            // Featured sounds
            SizedBox(
              height: 100,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(kFeaturedSounds.length, (index) {
                  final isSelected = index == _selectedIndex;
                  return _SoundCircle(
                    sound: kFeaturedSounds[index],
                    isSelected: isSelected,
                    size: isSelected ? 80 : 60,
                    onTap: () => _onSoundTap(index),
                  );
                }),
              ),
            ),

            const SizedBox(height: 24),

            // "More sounds" section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30),
              child: Row(
                children: [
                  Icon(Icons.spa_outlined,
                      color: Colors.white.withValues(alpha: 0.7), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'More sounds',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 92,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                itemCount: kMoreSounds.length,
                separatorBuilder: (_, __) => const SizedBox(width: 14),
                itemBuilder: (context, i) {
                  final index = kFeaturedSounds.length + i;
                  final sound = kMoreSounds[i];
                  final isSelected = index == _selectedIndex;
                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _SoundCircle(
                        sound: sound,
                        isSelected: isSelected,
                        size: 56,
                        fontSize: 22,
                        onTap: () => _onSoundTap(index),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        sound.name,
                        style: TextStyle(
                          color: Colors.white
                              .withValues(alpha: isSelected ? 0.9 : 0.5),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),

            const Spacer(),

            // Selected sound title
            Text(
              _selectedSound.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w300,
              ),
            ),

            const Spacer(),

            // Controls
            Container(
              margin: const EdgeInsets.all(30),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Icon(Icons.bedtime,
                          color: Colors.white.withValues(alpha: 0.8), size: 20),
                      const SizedBox(width: 10),
                      Text('Sleep Timer',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.8))),
                      const Spacer(),
                      if (_timerActive)
                        Text(
                          _formatTimer(),
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                    ],
                  ),
                  const SizedBox(height: 15),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [0, 15, 30, 60].map((minutes) {
                      final isSelected = _timerMinutes == minutes;
                      return GestureDetector(
                        onTap: () => _setTimer(minutes),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white
                                .withValues(alpha: isSelected ? 0.3 : 0.1),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Text(
                            minutes == 0 ? 'Off' : '${minutes}m',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Icon(Icons.volume_down,
                          color: Colors.white.withValues(alpha: 0.6), size: 18),
                      Expanded(
                        child: Slider(
                          value: _volume,
                          activeColor: Colors.white,
                          inactiveColor: Colors.white.withValues(alpha: 0.3),
                          onChanged: (value) {
                            setState(() => _volume = value);
                            _audioHandler.setVolume(value);
                          },
                        ),
                      ),
                      Icon(Icons.volume_up,
                          color: Colors.white.withValues(alpha: 0.6), size: 18),
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

class _SoundCircle extends StatelessWidget {
  final Sound sound;
  final bool isSelected;
  final double size;
  final double? fontSize;
  final VoidCallback onTap;

  const _SoundCircle({
    required this.sound,
    required this.isSelected,
    required this.size,
    required this.onTap,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white.withValues(alpha: isSelected ? 0.3 : 0.1),
          border: Border.all(
            color: Colors.white.withValues(alpha: isSelected ? 0.8 : 0.3),
            width: isSelected ? 3 : 1,
          ),
        ),
        child: Center(
          child: Text(
            sound.icon,
            style: TextStyle(fontSize: fontSize ?? (isSelected ? 30 : 24)),
          ),
        ),
      ),
    );
  }
}
