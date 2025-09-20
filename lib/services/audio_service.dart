import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';
import 'dart:async';

class AudioPlayerHandler extends BaseAudioHandler with SeekHandler {
  static final _instance = AudioPlayerHandler._internal();
  factory AudioPlayerHandler() => _instance;
  AudioPlayerHandler._internal();

  final AudioPlayer _player = AudioPlayer();
  bool _isInitialized = false;

  static AudioPlayerHandler get instance => _instance;

  // Stream para comunicar con el widget
  final StreamController<String> _controlEventController = StreamController<String>.broadcast();
  Stream<String> get controlEvents => _controlEventController.stream;

  Future<void> initializeIfNeeded() async {
    if (_isInitialized) return;

    // Set initial state
    playbackState.add(PlaybackState(
      controls: [MediaControl.play],
      playing: false,
      processingState: AudioProcessingState.idle,
    ));

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

    // Set media item for notification
    mediaItem.add(MediaItem(
      id: assetPath,
      title: title,
      artist: 'Jewel Rain',
      album: 'Nature Sounds',
      duration: null, // Loop infinito
      artUri: null, // Removemos el icono por ahora para evitar problemas
      extras: {'isLoop': true},
    ));

    // Solo actualizar el estado para la notificación, no reproducir
    playbackState.add(PlaybackState(
      controls: [MediaControl.pause, MediaControl.stop],
      playing: true,
      processingState: AudioProcessingState.ready,
      updatePosition: Duration.zero,
    ));

    // Debug: verificar que el estado se está enviando
    print('AudioService: Setting playback state to playing');
  }

  @override
  Future<void> play() async {
    print('AudioService: Play button pressed');
    _controlEventController.add('play');

    // Update state immediately for responsiveness
    playbackState.add(PlaybackState(
      controls: [MediaControl.pause, MediaControl.stop],
      playing: true,
      processingState: AudioProcessingState.ready,
    ));
  }

  @override
  Future<void> pause() async {
    print('AudioService: Pause button pressed');
    _controlEventController.add('pause');

    // Update state immediately for responsiveness
    playbackState.add(PlaybackState(
      controls: [MediaControl.play, MediaControl.stop],
      playing: false,
      processingState: AudioProcessingState.ready,
    ));
  }

  @override
  Future<void> stop() async {
    print('AudioService: Stop button pressed');
    _controlEventController.add('stop');

    // Stop the actual audio player
    await _player.stop();

    // Update playback state to stopped
    playbackState.add(PlaybackState(
      controls: [MediaControl.play],
      playing: false,
      processingState: AudioProcessingState.idle,
    ));
  }

  @override
  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  Future<void> setVolume(double volume) async {
    await _player.setVolume(volume);
  }

  bool get isPlaying => _player.playing;

  Future<void> stopAndDispose() async {
    try {
      await _player.stop();
      await _player.dispose();
      await _controlEventController.close();

      // Clear media item and reset state
      mediaItem.add(null);
      playbackState.add(PlaybackState(
        controls: [MediaControl.play],
        playing: false,
        processingState: AudioProcessingState.idle,
      ));

      _isInitialized = false;
      print('AudioService: Stopped and disposed successfully');
    } catch (e) {
      print('Error during stopAndDispose: $e');
    }
  }

  void dispose() {
    _player.dispose();
    _controlEventController.close();
  }
}