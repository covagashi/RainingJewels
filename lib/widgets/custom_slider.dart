
import 'package:flutter/material.dart';
import 'package:rainingjewels_new/widgets/custom_slider_thumb.dart';

class SliderWidget extends StatefulWidget {
  final double sliderHeight;
  final int min;
  final int max;
  final fullWidth;
  double acValue;

  SliderWidget(
      {this.sliderHeight = 48,
      this.max = 10,
      this.min = 0,
      this.acValue = 70,
      this.fullWidth = false});

  @override
  _SliderWidgetState createState() => _SliderWidgetState();
}

class _SliderWidgetState extends State<SliderWidget> {

  

  @override
  Widget build(BuildContext context) {
    return Container(
      width: this.widget.fullWidth ? double.infinity : 300,
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      margin: EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Etiqueta de volumen
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
                '${widget.acValue.round()}',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          // Slider moderno
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
              valueIndicatorShape: PaddleSliderValueIndicatorShape(),
              valueIndicatorColor: Colors.white,
              valueIndicatorTextStyle: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
            child: Slider(
              value: widget.acValue,
              min: widget.min.toDouble(),
              max: widget.max.toDouble(),
              divisions: widget.max - widget.min,
              label: '${widget.acValue.round()}',
              onChanged: (value) {
                setState(() {
                  widget.acValue = value;
                });
              },
            ),
          ),
        ],
      ),
    );
  }
}