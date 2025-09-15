import 'dart:async';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';

class ModernAudioPlayer extends StatefulWidget {
  final int selectedIndex;
  final AudioPlayer audioPlayer;

  const ModernAudioPlayer({
    Key? key,
    required this.selectedIndex,
    required this.audioPlayer,
  }) : super(key: key);

  @override
  _ModernAudioPlayerState createState() => _ModernAudioPlayerState();
}

class _ModernAudioPlayerState extends State<ModernAudioPlayer>
    with TickerProviderStateMixin {
  bool _isPlaying = false;
  double _volume = 70.0;
  late AnimationController _playButtonController;
  late AnimationController _waveController;

  final List<SoundData> _sounds = [
    SoundData(
      name: 'Rain',
      asset: 'rain.mp3',
      icon: Icons.grain,
      color: Colors.blue.shade300,
      description: 'Gentle rainfall sounds',
    ),
    SoundData(
      name: 'Thunder',
      asset: 'thunder.mp3',
      icon: Icons.flash_on,
      color: Colors.purple.shade300,
      description: 'Distant thunder rumbles',
    ),
    SoundData(
      name: 'Wind',
      asset: 'wind.mp3',
      icon: Icons.air,
      color: Colors.green.shade300,
      description: 'Soft wind through trees',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _playButtonController = AnimationController(
      duration: Duration(milliseconds: 300),
      vsync: this,
    );
    _waveController = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _playButtonController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  void _togglePlayback() async {
    if (_isPlaying) {
      await widget.audioPlayer.stop();
      _playButtonController.reverse();
    } else {
      String assetPath = 'assets/${_sounds[widget.selectedIndex].asset}';
      await widget.audioPlayer.play(AssetSource(_sounds[widget.selectedIndex].asset));
      await widget.audioPlayer.setVolume(_volume / 100);
      _playButtonController.forward();
    }

    setState(() {
      _isPlaying = !_isPlaying;
    });
  }

  void _updateVolume(double value) async {
    setState(() {
      _volume = value;
    });
    await widget.audioPlayer.setVolume(_volume / 100);
  }

  @override
  Widget build(BuildContext context) {
    SoundData currentSound = _sounds[widget.selectedIndex];

    return Container(
      margin: EdgeInsets.all(20),
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Sound icon and info
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  currentSound.color.withOpacity(0.3),
                  currentSound.color.withOpacity(0.1),
                ],
              ),
              border: Border.all(
                color: currentSound.color.withOpacity(0.4),
                width: 2,
              ),
            ),
            child: AnimatedBuilder(
              animation: _waveController,
              builder: (context, child) {
                return Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: _isPlaying ? [
                      BoxShadow(
                        color: currentSound.color.withOpacity(0.3 * _waveController.value),
                        blurRadius: 20 + (10 * _waveController.value),
                        spreadRadius: 5 + (5 * _waveController.value),
                      ),
                    ] : null,
                  ),
                  child: Icon(
                    currentSound.icon,
                    size: 48,
                    color: Colors.white,
                  ),
                );
              },
            ),
          ),

          SizedBox(height: 32),

          // Sound name and description
          Text(
            currentSound.name,
            style: TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w600,
            ),
          ),

          SizedBox(height: 8),

          Text(
            currentSound.description,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 16,
            ),
          ),

          SizedBox(height: 40),

          // Play button
          GestureDetector(
            onTap: _togglePlayback,
            child: AnimatedBuilder(
              animation: _playButtonController,
              builder: (context, child) {
                return Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.9),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 12,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Icon(
                    _isPlaying ? Icons.pause : Icons.play_arrow,
                    size: 36,
                    color: currentSound.color,
                  ),
                );
              },
            ),
          ),

          SizedBox(height: 40),

          // Volume control
          Container(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Colors.white.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.volume_up_rounded,
                      color: Colors.white.withOpacity(0.9),
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Volume',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Spacer(),
                    Text(
                      '${_volume.round()}',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 12),
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: Colors.white,
                    inactiveTrackColor: Colors.white.withOpacity(0.3),
                    trackHeight: 4.0,
                    thumbColor: Colors.white,
                    thumbShape: RoundSliderThumbShape(
                      enabledThumbRadius: 8.0,
                      elevation: 4.0,
                    ),
                    overlayColor: Colors.white.withOpacity(0.2),
                    overlayShape: RoundSliderOverlayShape(overlayRadius: 16.0),
                  ),
                  child: Slider(
                    value: _volume,
                    min: 0.0,
                    max: 100.0,
                    divisions: 20,
                    onChanged: _updateVolume,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SoundData {
  final String name;
  final String asset;
  final IconData icon;
  final Color color;
  final String description;

  SoundData({
    required this.name,
    required this.asset,
    required this.icon,
    required this.color,
    required this.description,
  });
}