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
  StreamController<String>? _controlEventController;

  StreamController<String> get _getOrCreateController {
    if (_controlEventController == null || _controlEventController!.isClosed) {
      _controlEventController = StreamController<String>.broadcast();
    }
    return _controlEventController!;
  }

  Stream<String> get controlEvents => _getOrCreateController.stream;

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
    _getOrCreateController.add('play');

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
    _getOrCreateController.add('pause');

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
    _getOrCreateController.add('stop');

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
      // Stop the player first
      await _player.stop();

      // Clear the media session
      mediaItem.add(null);

      // Set the playback state to stopped/idle to remove notification
      playbackState.add(PlaybackState(
        controls: [MediaControl.play],
        playing: false,
        processingState: AudioProcessingState.idle,
      ));

      // Close the stream controller
      if (_controlEventController != null && !_controlEventController!.isClosed) {
        await _controlEventController!.close();
        _controlEventController = null;
      }

      // Dispose the player
      await _player.dispose();

      _isInitialized = false;
      print('AudioService: Stopped and disposed successfully');
    } catch (e) {
      print('Error during stopAndDispose: $e');
    }
  }

  void dispose() {
    _player.dispose();
    if (_controlEventController != null && !_controlEventController!.isClosed) {
      _controlEventController!.close();
    }
  }
}