import 'dart:math';
import 'package:flutter/material.dart';

class SimpleDiamondRain extends StatefulWidget {
  @override
  _SimpleDiamondRainState createState() => _SimpleDiamondRainState();
}

class _SimpleDiamondRainState extends State<SimpleDiamondRain>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  List<DiamondDrop> diamonds = [];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 3),
      vsync: this,
    )..repeat();

    // Crear diamantes
    for (int i = 0; i < 25; i++) {
      diamonds.add(DiamondDrop(i));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: DiamondRainPainter(diamonds, _controller.value),
          size: Size.infinite,
        );
      },
    );
  }
}

class DiamondRainPainter extends CustomPainter {
  final List<DiamondDrop> diamonds;
  final double animationValue;

  DiamondRainPainter(this.diamonds, this.animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    for (DiamondDrop diamond in diamonds) {
      // Actualizar posición
      double y = (diamond.startY + animationValue * diamond.speed * size.height) % (size.height + 100);
      double x = diamond.startX * size.width + sin(animationValue * 2 + diamond.startY * 10) * 30;

      if (y > size.height) {
        y = y - size.height - 100;
      }

      // Dibujar diamante
      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(animationValue * diamond.rotationSpeed);

      // Diamante simple pero visible
      Paint paint = Paint()
        ..color = diamond.color
        ..style = PaintingStyle.fill;

      Path diamondPath = Path();
      double s = diamond.size;

      // Forma de diamante clara
      diamondPath.moveTo(0, -s);        // Top
      diamondPath.lineTo(s * 0.7, 0);   // Right
      diamondPath.lineTo(0, s);         // Bottom
      diamondPath.lineTo(-s * 0.7, 0);  // Left
      diamondPath.close();

      canvas.drawPath(diamondPath, paint);

      // Brillo blanco en el centro
      Paint glowPaint = Paint()
        ..color = Colors.white.withOpacity(0.8)
        ..style = PaintingStyle.fill;

      Path glowPath = Path();
      diamondPath.moveTo(0, -s * 0.3);
      diamondPath.lineTo(s * 0.2, 0);
      diamondPath.lineTo(0, s * 0.3);
      diamondPath.lineTo(-s * 0.2, 0);
      diamondPath.close();

      canvas.drawPath(glowPath, glowPaint);

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

class DiamondDrop {
  late double startX;
  late double startY;
  late double size;
  late double speed;
  late double rotationSpeed;
  late Color color;

  DiamondDrop(int index) {
    startX = (index * 0.17) % 1.0;
    startY = (index * 0.13) % 1.0;
    size = 8 + (index % 8);
    speed = 0.3 + (index % 3) * 0.2;
    rotationSpeed = ((index % 5) - 2) * 2;

    List<Color> colors = [
      Colors.blue.withOpacity(0.8),
      Colors.purple.withOpacity(0.8),
      Colors.green.withOpacity(0.8),
      Colors.pink.withOpacity(0.8),
      Colors.cyan.withOpacity(0.8),
      Colors.amber.withOpacity(0.8),
    ];
    color = colors[index % colors.length];
  }
}