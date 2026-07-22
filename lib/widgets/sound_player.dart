import 'dart:async';

import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import '../models/sound.dart';
import '../services/audio_service.dart';
import '../theme.dart';
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
      backgroundColor: kBgMid,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.email_outlined, color: kTextSecondary),
              title: const Text('Contact', style: TextStyle(color: kTextPrimary)),
              subtitle: const Text(
                'hello@covaga.xyz — Subject: Raining Jewels - FAQ',
                style: TextStyle(color: kTextTertiary),
              ),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading:
                  const Icon(Icons.library_music_outlined, color: kTextSecondary),
              title: const Text('Sound credits',
                  style: TextStyle(color: kTextPrimary)),
              subtitle: const Text(
                'Licenses and authors of the bundled sounds',
                style: TextStyle(color: kTextTertiary),
              ),
              onTap: () {
                Navigator.pop(context);
                showSoundCreditsSheet(context);
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 16, 16, 0),
          child: Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Jewel Rain',
                      style: TextStyle(
                        color: kTextPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                      ),
                    ),
                    Text(
                      'Pick a sound and drift away',
                      style: TextStyle(color: kTextTertiary, fontSize: 13),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _showInfoSheet,
                style: IconButton.styleFrom(
                  backgroundColor: kGlassFill,
                  side: const BorderSide(color: kGlassBorder),
                ),
                icon: const Icon(Icons.info_outline,
                    color: kTextSecondary, size: 20),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Featured sounds
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(kFeaturedSounds.length, (index) {
            return _SoundTile(
              sound: kFeaturedSounds[index],
              isSelected: index == _selectedIndex,
              isPlaying: index == _selectedIndex && _isPlaying,
              size: 88,
              onTap: () => _onSoundTap(index),
            );
          }),
        ),

        const SizedBox(height: 28),

        // "More sounds" section
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 28),
          child: Text(
            'MORE SOUNDS',
            style: TextStyle(
              color: kTextTertiary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 2,
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            itemCount: kMoreSounds.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final index = kFeaturedSounds.length + i;
              return _SoundTile(
                sound: kMoreSounds[i],
                isSelected: index == _selectedIndex,
                isPlaying: index == _selectedIndex && _isPlaying,
                size: 68,
                showLabel: true,
                onTap: () => _onSoundTap(index),
              );
            },
          ),
        ),

        const Spacer(),

        // Selected sound title + play state
        Center(
          child: Column(
            children: [
              Text(
                _selectedSound.name,
                style: const TextStyle(
                  color: kTextPrimary,
                  fontSize: 30,
                  fontWeight: FontWeight.w300,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              AnimatedOpacity(
                duration: const Duration(milliseconds: 200),
                opacity: _isPlaying ? 1 : 0.4,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _isPlaying ? kAccentSoft : kGlassFill,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: _isPlaying ? kAccent : kGlassBorder, width: 1),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _isPlaying
                            ? Icons.graphic_eq
                            : Icons.pause_circle_outline,
                        color: _isPlaying ? kAccent : kTextTertiary,
                        size: 14,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isPlaying ? 'Playing' : 'Paused',
                        style: TextStyle(
                          color: _isPlaying ? kAccent : kTextTertiary,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        const Spacer(),

        // Controls
        Container(
          margin: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: kGlassFill,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: kGlassBorder),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  const Icon(Icons.bedtime_outlined,
                      color: kTextSecondary, size: 20),
                  const SizedBox(width: 10),
                  const Text('Sleep Timer',
                      style: TextStyle(color: kTextSecondary)),
                  const Spacer(),
                  if (_timerActive)
                    Text(
                      _formatTimer(),
                      style: const TextStyle(
                          color: kTextPrimary, fontWeight: FontWeight.bold),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [0, 15, 30, 60].map((minutes) {
                  final isSelected = _timerMinutes == minutes;
                  return GestureDetector(
                    onTap: () => _setTimer(minutes),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 7),
                      decoration: BoxDecoration(
                        color: isSelected ? kSelectedFill : kGlassFill,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? Colors.white70 : kGlassBorder,
                        ),
                      ),
                      child: Text(
                        minutes == 0 ? 'Off' : '${minutes}m',
                        style: TextStyle(
                          color: isSelected ? kTextPrimary : kTextSecondary,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  const Icon(Icons.volume_down,
                      color: kTextTertiary, size: 18),
                  Expanded(
                    child: SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 3,
                        thumbShape: const RoundSliderThumbShape(
                            enabledThumbRadius: 7),
                      ),
                      child: Slider(
                        value: _volume,
                        activeColor: kAccent,
                        inactiveColor: kGlassBorder,
                        onChanged: (value) {
                          setState(() => _volume = value);
                          _audioHandler.setVolume(value);
                        },
                      ),
                    ),
                  ),
                  const Icon(Icons.volume_up, color: kTextTertiary, size: 18),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SoundTile extends StatelessWidget {
  final Sound sound;
  final bool isSelected;
  final bool isPlaying;
  final double size;
  final bool showLabel;
  final VoidCallback onTap;

  const _SoundTile({
    required this.sound,
    required this.isSelected,
    required this.isPlaying,
    required this.size,
    required this.onTap,
    this.showLabel = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: isSelected ? kSelectedFill : kGlassFill,
              borderRadius: BorderRadius.circular(size * 0.3),
              border: Border.all(
                color: isSelected ? Colors.white70 : kGlassBorder,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Center(
              child: Text(sound.icon, style: TextStyle(fontSize: size * 0.38)),
            ),
          ),
          if (showLabel) ...[
            const SizedBox(height: 6),
            Text(
              sound.name,
              style: TextStyle(
                color: isSelected ? kTextPrimary : kTextTertiary,
                fontSize: 11,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
