import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/sound.dart';
import '../theme.dart';

/// Shows the CC-BY attributions required for the bundled sounds.
void showSoundCreditsSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: kBgMid,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    isScrollControlled: true,
    builder: (context) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      builder: (context, scrollController) {
        final creditedSounds =
            kAllSounds.where((s) => s.attributions.isNotEmpty).toList();
        return ListView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Sound credits',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'These sounds come from the open-source Noice sound library '
              '(trynoice.com), which curates and edits recordings shared '
              'by their original authors under Creative Commons licenses. '
              'The recordings were edited into seamless loops.',
              style: TextStyle(color: Colors.white54, fontSize: 13),
            ),
            const SizedBox(height: 4),
            _LinkText(
              text: 'github.com/trynoice',
              url: 'https://github.com/trynoice',
            ),
            const SizedBox(height: 16),
            for (final sound in creditedSounds) ...[
              Text(
                '${sound.icon}  ${sound.name}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              for (final a in sound.attributions)
                Padding(
                  padding: const EdgeInsets.only(left: 12, bottom: 6),
                  child: Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 4,
                    children: [
                      _LinkText(text: a.sourceName, url: a.sourceUrl),
                      Text('by', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      _LinkText(text: a.author, url: a.authorUrl),
                      Text('·', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      _LinkText(text: a.license, url: a.licenseUrl),
                    ],
                  ),
                ),
              const SizedBox(height: 10),
            ],
          ],
        );
      },
    ),
  );
}

class _LinkText extends StatelessWidget {
  final String text;
  final String url;

  const _LinkText({required this.text, required this.url});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
      child: Text(
        text,
        style: const TextStyle(
          color: kAccent,
          fontSize: 12,
          decoration: TextDecoration.underline,
          decorationColor: kAccent,
        ),
      ),
    );
  }
}
