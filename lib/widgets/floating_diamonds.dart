import 'dart:math';
import 'package:flutter/material.dart';

class FloatingDiamonds extends StatefulWidget {
  @override
  _FloatingDiamondsState createState() => _FloatingDiamondsState();
}

class _FloatingDiamondsState extends State<FloatingDiamonds>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  List<Diamond> diamonds = [];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 20),
      vsync: this,
    )..repeat();

    // Crear diamantes aleatorios
    for (int i = 0; i < 8; i++) {
      diamonds.add(Diamond());
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
          painter: DiamondPainter(diamonds, _controller.value),
          size: Size.infinite,
        );
      },
    );
  }
}

class Diamond {
  late double x;
  late double y;
  late double size;
  late double speed;
  late double opacity;
  late Color color;

  Diamond() {
    x = Random().nextDouble();
    y = Random().nextDouble();
    size = Random().nextDouble() * 8 + 4;
    speed = Random().nextDouble() * 0.5 + 0.2;
    opacity = Random().nextDouble() * 0.6 + 0.2;

    // Colores tipo diamante/cristal
    List<Color> diamondColors = [
      Colors.white,
      Colors.cyan.shade100,
      Colors.blue.shade100,
      Colors.purple.shade100,
    ];
    color = diamondColors[Random().nextInt(diamondColors.length)];
  }
}

class DiamondPainter extends CustomPainter {
  final List<Diamond> diamonds;
  final double animationValue;

  DiamondPainter(this.diamonds, this.animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    for (Diamond diamond in diamonds) {
      // Calcular posición flotante
      double currentY = (diamond.y + animationValue * diamond.speed) % 1.2;
      if (currentY > 1.0) currentY = currentY - 1.2;

      double currentX = diamond.x + sin(animationValue * 2 + diamond.y * 10) * 0.1;

      // Pintar diamante
      Paint paint = Paint()
        ..color = diamond.color.withOpacity(diamond.opacity)
        ..style = PaintingStyle.fill;

      // Forma de diamante
      Path diamondPath = Path();
      double centerX = currentX * size.width;
      double centerY = currentY * size.height;
      double s = diamond.size;

      diamondPath.moveTo(centerX, centerY - s);
      diamondPath.lineTo(centerX + s * 0.6, centerY);
      diamondPath.lineTo(centerX, centerY + s);
      diamondPath.lineTo(centerX - s * 0.6, centerY);
      diamondPath.close();

      canvas.drawPath(diamondPath, paint);

      // Brillo interior
      Paint glowPaint = Paint()
        ..color = Colors.white.withOpacity(diamond.opacity * 0.3)
        ..style = PaintingStyle.fill;

      Path innerGlow = Path();
      innerGlow.moveTo(centerX, centerY - s * 0.5);
      innerGlow.lineTo(centerX + s * 0.3, centerY);
      innerGlow.lineTo(centerX, centerY + s * 0.5);
      innerGlow.lineTo(centerX - s * 0.3, centerY);
      innerGlow.close();

      canvas.drawPath(innerGlow, glowPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}