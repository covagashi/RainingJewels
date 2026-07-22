import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';
import 'dart:async';
import 'package:flutter/foundation.dart';

class AudioPlayerHandler extends BaseAudioHandler with SeekHandler {
  static final _instance = AudioPlayerHandler._internal();
  factory AudioPlayerHandler() => _instance;
  AudioPlayerHandler._internal();

  final AudioPlayer _player = AudioPlayer();
  bool _isInitialized = false;

  static AudioPlayerHandler get instance => _instance;

  // Public getters for external access
  bool get isPlaying => _player.playing;
  double get volume => _player.volume;
  Stream<PlayerState> get playerStateStream => _player.playerStateStream;
  Stream<Duration> get positionStream => _player.positionStream;

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

    try {
      // Stop current playback if any
      await _player.stop();

      // Load and play the audio file
      await _player.setAsset('assets/$assetPath');
      await _player.setLoopMode(LoopMode.one); // Loop infinito
      await _player.play();

      // Set media item for notification
      mediaItem.add(MediaItem(
        id: assetPath,
        title: title,
        artist: 'Jewel Rain',
        album: 'Nature Sounds',
        duration: null, // Loop infinito
        artUri: null,
        extras: {'isLoop': true},
      ));

      // Update playback state
      playbackState.add(PlaybackState(
        controls: [MediaControl.pause, MediaControl.stop],
        playing: true,
        processingState: AudioProcessingState.ready,
      ));

    } catch (e) {
      debugPrint('AudioService: Error playing audio: $e');
      rethrow;
    }
  }

  @override
  Future<void> play() async {

    // Actually play the audio
    await _player.play();

    // Update state
    playbackState.add(PlaybackState(
      controls: [MediaControl.pause, MediaControl.stop],
      playing: true,
      processingState: AudioProcessingState.ready,
    ));
  }

  @override
  Future<void> pause() async {

    // Actually pause the audio
    await _player.pause();

    // Update state
    playbackState.add(PlaybackState(
      controls: [MediaControl.play, MediaControl.stop],
      playing: false,
      processingState: AudioProcessingState.ready,
    ));
  }

  @override
  Future<void> stop() async {

    // Stop the actual audio player
    await _player.stop();

    // Clear media item
    mediaItem.add(null);

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

      _isInitialized = false;
    } catch (e) {
      debugPrint('Error during stopAndDispose: $e');
    }
  }

  @override
  Future<void> onTaskRemoved() async {
    // Called when user swipes away the app from recents
    await stopAndDispose();
    await super.onTaskRemoved();
  }
}