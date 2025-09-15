import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';

class AmbientPlayer extends StatefulWidget {
  final int selectedIndex;
  final AudioPlayer audioPlayer;
  final Function(int) onSoundChange;

  const AmbientPlayer({
    Key? key,
    required this.selectedIndex,
    required this.audioPlayer,
    required this.onSoundChange,
  }) : super(key: key);

  @override
  _AmbientPlayerState createState() => _AmbientPlayerState();
}

class _AmbientPlayerState extends State<AmbientPlayer>
    with TickerProviderStateMixin {
  bool _isPlaying = false;
  double _volume = 0.7;
  Timer? _sleepTimer;
  int _sleepMinutes = 0;
  int _remainingSeconds = 0;
  bool _timerActive = false;

  late AnimationController _rippleController;
  late AnimationController _particleController;
  late AnimationController _breatheController;

  final List<AmbientSound> _sounds = [
    AmbientSound(
      name: 'Rain',
      asset: 'rain.mp3',
      icon: '🌧️',
      color: Color(0xFF4FC3F7),
      particles: DiamondRain(),
    ),
    AmbientSound(
      name: 'Thunder',
      asset: 'thunder.mp3',
      icon: '⚡',
      color: Color(0xFF7E57C2),
      particles: DiamondRain(),
    ),
    AmbientSound(
      name: 'Wind',
      asset: 'wind.mp3',
      icon: '🍃',
      color: Color(0xFF66BB6A),
      particles: DiamondRain(),
    ),
  ];

  @override
  void initState() {
    super.initState();

    _rippleController = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );

    _particleController = AnimationController(
      duration: Duration(seconds: 10),
      vsync: this,
    )..repeat();

    _breatheController = AnimationController(
      duration: Duration(seconds: 4),
      vsync: this,
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _rippleController.dispose();
    _particleController.dispose();
    _breatheController.dispose();
    _sleepTimer?.cancel();
    super.dispose();
  }

  void _togglePlay() async {
    if (_isPlaying) {
      await widget.audioPlayer.stop();
      _rippleController.stop();
    } else {
      await widget.audioPlayer.play(AssetSource(_sounds[widget.selectedIndex].asset));
      await widget.audioPlayer.setReleaseMode(ReleaseMode.loop);
      await widget.audioPlayer.setVolume(_volume);
      _rippleController.repeat();
    }

    setState(() {
      _isPlaying = !_isPlaying;
    });
  }

  void _updateVolume(double value) async {
    setState(() {
      _volume = value;
    });
    await widget.audioPlayer.setVolume(_volume);
  }

  void _setSleepTimer(int minutes) {
    _sleepTimer?.cancel();

    if (minutes == 0) {
      setState(() {
        _timerActive = false;
        _sleepMinutes = 0;
        _remainingSeconds = 0;
      });
      return;
    }

    setState(() {
      _sleepMinutes = minutes;
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

  void _switchSound(int newIndex) async {
    await widget.audioPlayer.stop();
    await widget.audioPlayer.play(AssetSource(_sounds[newIndex].asset));
    await widget.audioPlayer.setReleaseMode(ReleaseMode.loop);
    await widget.audioPlayer.setVolume(_volume);
  }

  void _fadeOutAndStop() async {
    for (double vol = _volume; vol >= 0; vol -= 0.05) {
      await widget.audioPlayer.setVolume(vol);
      await Future.delayed(Duration(milliseconds: 100));
    }

    await widget.audioPlayer.stop();
    await widget.audioPlayer.setVolume(_volume);

    setState(() {
      _isPlaying = false;
      _timerActive = false;
      _remainingSeconds = 0;
    });

    _rippleController.stop();
  }

  String _formatTimer() {
    int minutes = _remainingSeconds ~/ 60;
    int seconds = _remainingSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final currentSound = _sounds[widget.selectedIndex];

    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1.2,
          colors: [
            currentSound.color.withOpacity(0.3),
            currentSound.color.withOpacity(0.1),
            Colors.transparent,
          ],
        ),
      ),
      child: Stack(
        children: [
          // Partículas animadas de fondo
          AnimatedBuilder(
            animation: _particleController,
            builder: (context, child) {
              return CustomPaint(
                painter: currentSound.particles.getPainter(_particleController.value),
                size: Size.infinite,
              );
            },
          ),

          // Contenido principal
          Column(
            children: [
              SizedBox(height: 100),

              // Selector de sonidos horizontal
              Container(
                height: 120,
                child: PageView.builder(
                  controller: PageController(
                    viewportFraction: 0.35,
                    initialPage: widget.selectedIndex,
                  ),
                  onPageChanged: (index) {
                    widget.onSoundChange(index);
                    if (_isPlaying) {
                      _switchSound(index);
                    }
                  },
                  itemCount: _sounds.length,
                  itemBuilder: (context, index) {
                    final sound = _sounds[index];
                    final isSelected = index == widget.selectedIndex;

                    return AnimatedContainer(
                      duration: Duration(milliseconds: 300),
                      margin: EdgeInsets.symmetric(horizontal: 10),
                      child: Column(
                        children: [
                          Container(
                            width: isSelected ? 80 : 60,
                            height: isSelected ? 80 : 60,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: sound.color.withOpacity(isSelected ? 0.3 : 0.1),
                              border: Border.all(
                                color: sound.color.withOpacity(isSelected ? 0.8 : 0.3),
                                width: isSelected ? 3 : 1,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                sound.icon,
                                style: TextStyle(fontSize: isSelected ? 32 : 24),
                              ),
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            sound.name,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: isSelected ? 16 : 12,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              Spacer(),

              // Botón de play central con efecto ripple
              AnimatedBuilder(
                animation: Listenable.merge([_rippleController, _breatheController]),
                builder: (context, child) {
                  return Stack(
                    alignment: Alignment.center,
                    children: [
                      // Ripples cuando está reproduciéndose
                      if (_isPlaying) ...[
                        for (int i = 0; i < 3; i++)
                          Transform.scale(
                            scale: 1 + (_rippleController.value + i * 0.3) * 2,
                            child: Container(
                              width: 120,
                              height: 120,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: currentSound.color.withOpacity(
                                    (1 - (_rippleController.value + i * 0.3)).clamp(0.0, 0.3),
                                  ),
                                  width: 2,
                                ),
                              ),
                            ),
                          ),
                      ],

                      // Botón principal con breathing
                      Transform.scale(
                        scale: _isPlaying ? 1.0 : (0.95 + _breatheController.value * 0.05),
                        child: GestureDetector(
                          onTap: _togglePlay,
                          child: Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  Colors.white,
                                  Colors.white.withOpacity(0.9),
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: currentSound.color.withOpacity(0.4),
                                  blurRadius: 20,
                                  spreadRadius: _isPlaying ? 10 : 0,
                                ),
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 10,
                                  offset: Offset(0, 5),
                                ),
                              ],
                            ),
                            child: Icon(
                              _isPlaying ? Icons.pause : Icons.play_arrow,
                              size: 40,
                              color: currentSound.color,
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),

              Spacer(),

              // Controles inferiores
              Container(
                margin: EdgeInsets.all(30),
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Timer
                    Row(
                      children: [
                        Icon(Icons.bedtime, color: Colors.white.withOpacity(0.8), size: 20),
                        SizedBox(width: 10),
                        Text(
                          'Sleep Timer',
                          style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
                        ),
                        Spacer(),
                        if (_timerActive)
                          Text(
                            _formatTimer(),
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                          ),
                      ],
                    ),
                    SizedBox(height: 15),

                    // Timer buttons
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [0, 15, 30, 60].map((minutes) {
                        final isSelected = _sleepMinutes == minutes;
                        return GestureDetector(
                          onTap: () => _setSleepTimer(minutes),
                          child: Container(
                            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected
                                ? currentSound.color.withOpacity(0.3)
                                : Colors.white.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(15),
                              border: isSelected ? Border.all(
                                color: currentSound.color.withOpacity(0.6),
                              ) : null,
                            ),
                            child: Text(
                              minutes == 0 ? 'Off' : '${minutes}m',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
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
                          child: SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              activeTrackColor: currentSound.color,
                              inactiveTrackColor: Colors.white.withOpacity(0.2),
                              thumbColor: Colors.white,
                              trackHeight: 3,
                              thumbShape: RoundSliderThumbShape(enabledThumbRadius: 8),
                              overlayShape: RoundSliderOverlayShape(overlayRadius: 16),
                            ),
                            child: Slider(
                              value: _volume,
                              onChanged: _updateVolume,
                            ),
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
      ),
    );
  }
}

class AmbientSound {
  final String name;
  final String asset;
  final String icon;
  final Color color;
  final ParticleSystem particles;

  AmbientSound({
    required this.name,
    required this.asset,
    required this.icon,
    required this.color,
    required this.particles,
  });
}

abstract class ParticleSystem {
  CustomPainter getPainter(double animation);
}

class DiamondRain extends ParticleSystem {
  @override
  CustomPainter getPainter(double animation) => DiamondRainPainter(animation);
}

class DiamondRainPainter extends CustomPainter {
  final double animation;
  late List<Diamond> diamonds;

  DiamondRainPainter(this.animation) {
    diamonds = List.generate(30, (i) => Diamond(i));
  }

  @override
  void paint(Canvas canvas, Size size) {
    for (var diamond in diamonds) {
      diamond.update(animation, size);

      canvas.save();
      canvas.translate(diamond.x, diamond.y);
      canvas.rotate(diamond.rotation);

      // Diamante principal con gradiente
      Path diamondPath = diamond.getPath();

      final paint = Paint()
        ..shader = RadialGradient(
          colors: [
            Colors.white.withOpacity(diamond.opacity),
            diamond.color.withOpacity(diamond.opacity * 0.8),
            diamond.color.withOpacity(diamond.opacity * 0.3),
          ],
          stops: [0.0, 0.5, 1.0],
        ).createShader(Rect.fromCircle(center: Offset.zero, radius: diamond.size));

      canvas.drawPath(diamondPath, paint);

      // Brillo interior
      final glowPaint = Paint()
        ..color = Colors.white.withOpacity(diamond.opacity * 0.6)
        ..style = PaintingStyle.fill;

      Path innerPath = diamond.getInnerPath();
      canvas.drawPath(innerPath, glowPaint);

      // Destellos
      if (diamond.sparkle > 0.8) {
        final sparklePaint = Paint()
          ..color = Colors.white.withOpacity((diamond.sparkle - 0.8) * 5)
          ..strokeWidth = 1
          ..strokeCap = StrokeCap.round;

        // Cruz de destello
        canvas.drawLine(Offset(-diamond.size * 1.5, 0), Offset(diamond.size * 1.5, 0), sparklePaint);
        canvas.drawLine(Offset(0, -diamond.size * 1.5), Offset(0, diamond.size * 1.5), sparklePaint);
      }

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

class Diamond {
  late double x;
  late double y;
  late double size;
  late double speed;
  late double opacity;
  late double rotation;
  late double rotationSpeed;
  late double sparkle;
  late Color color;

  Diamond(int index) {
    reset(index);
  }

  void reset(int index) {
    x = (index * 73.7) % 450;
    y = -100.0;
    size = 8 + (index % 12);
    speed = 60 + (index % 40);
    opacity = 0.6 + (index % 4) * 0.1;
    rotation = 0;
    rotationSpeed = ((index % 7) - 3) * 0.05;
    sparkle = 0;

    List<Color> diamondColors = [
      Color(0xFF64B5F6),  // Azul
      Color(0xFFBA68C8),  // Púrpura
      Color(0xFF81C784),  // Verde
      Color(0xFFF06292),  // Rosa
      Color(0xFF4DD0E1),  // Cian
      Color(0xFFFFB74D),  // Ámbar
    ];
    color = diamondColors[index % diamondColors.length];
  }

  void update(double time, Size size) {
    y += speed * 0.016;
    x += sin(time * 2 + y * 0.01) * 0.5;
    rotation += rotationSpeed;
    sparkle = sin(time * 4 + x * 0.02);

    if (y > size.height + 100) {
      reset(x.hashCode);
    }

    if (x < -50 || x > size.width + 50) {
      x = x.clamp(-50, size.width + 50);
    }
  }

  Path getPath() {
    Path path = Path();

    // Forma de diamante clásica
    path.moveTo(0, -size);                    // Top
    path.lineTo(size * 0.6, -size * 0.3);    // Top right
    path.lineTo(size * 0.8, size * 0.3);     // Bottom right
    path.lineTo(0, size);                     // Bottom
    path.lineTo(-size * 0.8, size * 0.3);    // Bottom left
    path.lineTo(-size * 0.6, -size * 0.3);   // Top left
    path.close();

    return path;
  }

  Path getInnerPath() {
    Path path = Path();
    double innerSize = size * 0.4;

    path.moveTo(0, -innerSize);
    path.lineTo(innerSize * 0.5, 0);
    path.lineTo(0, innerSize);
    path.lineTo(-innerSize * 0.5, 0);
    path.close();

    return path;
  }
}