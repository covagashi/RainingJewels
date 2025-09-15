import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';

class AudioPlayerHandler extends BaseAudioHandler with SeekHandler {
  static final _instance = AudioPlayerHandler._internal();
  factory AudioPlayerHandler() => _instance;
  AudioPlayerHandler._internal();

  final AudioPlayer _player = AudioPlayer();
  bool _isInitialized = false;

  static AudioPlayerHandler get instance => _instance;

  Future<void> initializeIfNeeded() async {
    if (_isInitialized) return;

    // Configure player
    _player.playerStateStream.listen((playerState) {
      final isPlaying = playerState.playing;
      final processingState = playerState.processingState;

      PlaybackState state;
      switch (processingState) {
        case ProcessingState.idle:
          state = PlaybackState(
            controls: [MediaControl.play],
            playing: false,
            processingState: AudioProcessingState.idle,
          );
          break;
        case ProcessingState.loading:
        case ProcessingState.buffering:
          state = PlaybackState(
            controls: [MediaControl.pause, MediaControl.stop],
            playing: false,
            processingState: AudioProcessingState.buffering,
          );
          break;
        case ProcessingState.ready:
          state = PlaybackState(
            controls: [
              if (isPlaying) MediaControl.pause else MediaControl.play,
              MediaControl.stop,
            ],
            playing: isPlaying,
            processingState: AudioProcessingState.ready,
          );
          break;
        case ProcessingState.completed:
          state = PlaybackState(
            controls: [MediaControl.play],
            playing: false,
            processingState: AudioProcessingState.completed,
          );
          break;
      }
      playbackState.add(state);
    });

    _isInitialized = true;
  }

  Future<void> playAudio(String assetPath, String title) async {
    await initializeIfNeeded();

    // Set media item
    mediaItem.add(MediaItem(
      id: assetPath,
      title: title,
      artist: 'Jewel Rain',
      duration: null, // Loop infinito
      artUri: null,
    ));

    try {
      await _player.setAsset('assets/$assetPath');
      await _player.setLoopMode(LoopMode.one);
      await _player.play();
    } catch (e) {
      print('Error playing audio: $e');
    }
  }

  @override
  Future<void> play() async {
    await _player.play();
  }

  @override
  Future<void> pause() async {
    await _player.pause();
  }

  @override
  Future<void> stop() async {
    await _player.stop();
    await _player.seek(Duration.zero);
  }

  @override
  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  Future<void> setVolume(double volume) async {
    await _player.setVolume(volume);
  }

  bool get isPlaying => _player.playing;

  void dispose() {
    _player.dispose();
  }
}