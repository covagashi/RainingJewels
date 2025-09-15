import 'dart:math';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';

class FloatingAudioControls extends StatefulWidget {
  final AudioPlayer fixedPlayer;
  final Function(int) onSoundSelected;
  final int selectedIndex;

  const FloatingAudioControls({
    Key? key,
    required this.fixedPlayer,
    required this.onSoundSelected,
    required this.selectedIndex,
  }) : super(key: key);

  @override
  _FloatingAudioControlsState createState() => _FloatingAudioControlsState();
}

class _FloatingAudioControlsState extends State<FloatingAudioControls>
    with TickerProviderStateMixin {
  late AnimationController _floatController;
  late List<AnimationController> _buttonControllers;

  final List<AudioControlData> _audioControls = [
    AudioControlData(
      icon: Icons.grain,
      label: 'Rain',
      color: Colors.blue.shade300,
      asset: 'rain.mp3',
    ),
    AudioControlData(
      icon: Icons.flash_on,
      label: 'Thunder',
      color: Colors.purple.shade300,
      asset: 'thunder.mp3',
    ),
    AudioControlData(
      icon: Icons.air,
      label: 'Wind',
      color: Colors.green.shade300,
      asset: 'wind.mp3',
    ),
  ];

  @override
  void initState() {
    super.initState();

    _floatController = AnimationController(
      duration: Duration(seconds: 3),
      vsync: this,
    )..repeat();

    _buttonControllers = List.generate(
      _audioControls.length,
      (index) => AnimationController(
        duration: Duration(milliseconds: 300),
        vsync: this,
      ),
    );
  }

  @override
  void dispose() {
    _floatController.dispose();
    for (var controller in _buttonControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 30,
      top: 100,
      child: Column(
        children: List.generate(_audioControls.length, (index) {
          return AnimatedBuilder(
            animation: _floatController,
            builder: (context, child) {
              double offset = sin(_floatController.value * 2 * pi + index * 0.5) * 8;
              bool isSelected = widget.selectedIndex == index;

              return Transform.translate(
                offset: Offset(0, offset),
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 15),
                  child: GestureDetector(
                    onTap: () {
                      _buttonControllers[index].forward().then((_) {
                        _buttonControllers[index].reverse();
                      });
                      widget.onSoundSelected(index);
                    },
                    child: AnimatedBuilder(
                      animation: _buttonControllers[index],
                      builder: (context, child) {
                        double scale = 1.0 + _buttonControllers[index].value * 0.2;

                        return Transform.scale(
                          scale: scale,
                          child: Container(
                            width: isSelected ? 70 : 60,
                            height: isSelected ? 70 : 60,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  _audioControls[index].color.withOpacity(0.8),
                                  _audioControls[index].color.withOpacity(0.4),
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: _audioControls[index].color.withOpacity(0.3),
                                  blurRadius: isSelected ? 20 : 10,
                                  spreadRadius: isSelected ? 5 : 2,
                                ),
                              ],
                              border: Border.all(
                                color: Colors.white.withOpacity(0.3),
                                width: 2,
                              ),
                            ),
                            child: Icon(
                              _audioControls[index].icon,
                              color: Colors.white,
                              size: isSelected ? 32 : 28,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              );
            },
          );
        }),
      ),
    );
  }
}

class AudioControlData {
  final IconData icon;
  final String label;
  final Color color;
  final String asset;

  AudioControlData({
    required this.icon,
    required this.label,
    required this.color,
    required this.asset,
  });
}