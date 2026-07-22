import 'package:flutter/foundation.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ReviewService {
  static final InAppReview _inAppReview = InAppReview.instance;

  // Configuración de cuotas y condiciones según mejores prácticas de Google
  static const int _minSessionsBeforeReview = 5; // Mayor número para asegurar "sufficient time"
  static const int _minDaysBeforeFirstReview = 7; // Esperar al menos 1 semana
  static const int _daysBetweenReviews = 120; // 4 meses entre solicitudes para respetar cuotas
  static const String _lastReviewDateKey = 'last_review_date';
  static const String _sessionCountKey = 'session_count';
  static const String _hasReviewedKey = 'has_reviewed';
  static const String _firstLaunchDateKey = 'first_launch_date';

  /// Incrementa el contador de sesiones y registra la primera vez
  static Future<void> incrementSessionCount() async {
    final prefs = await SharedPreferences.getInstance();

    // Registrar fecha de primera instalación si no existe
    if (!prefs.containsKey(_firstLaunchDateKey)) {
      await prefs.setString(_firstLaunchDateKey, DateTime.now().toIso8601String());
    }

    final currentCount = prefs.getInt(_sessionCountKey) ?? 0;
    await prefs.setInt(_sessionCountKey, currentCount + 1);
  }

  /// Verifica si está disponible la funcionalidad de reseñas
  static Future<bool> isAvailable() async {
    return await _inAppReview.isAvailable();
  }

  /// Solicita una reseña si se cumplen todas las condiciones
  /// Respeta las cuotas de Google Play y mejores prácticas
  static Future<void> requestReviewIfAppropriate() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // Verificar disponibilidad del sistema primero (más eficiente)
      if (!await isAvailable()) return;

      // Verificar si ya ha dejado reseña
      final hasReviewed = prefs.getBool(_hasReviewedKey) ?? false;
      if (hasReviewed) return;

      // Verificar que haya pasado tiempo suficiente desde la instalación
      final firstLaunchDate = prefs.getString(_firstLaunchDateKey);
      if (firstLaunchDate != null) {
        final firstLaunch = DateTime.parse(firstLaunchDate);
        final daysSinceInstall = DateTime.now().difference(firstLaunch).inDays;
        if (daysSinceInstall < _minDaysBeforeFirstReview) return;
      }

      // Verificar número de sesiones (sufficient time with app)
      final sessionCount = prefs.getInt(_sessionCountKey) ?? 0;
      if (sessionCount < _minSessionsBeforeReview) return;

      // Verificar tiempo desde última solicitud para respetar cuotas
      final lastReviewDate = prefs.getString(_lastReviewDateKey);
      if (lastReviewDate != null) {
        final lastDate = DateTime.parse(lastReviewDate);
        final daysSinceLastReview = DateTime.now().difference(lastDate).inDays;
        if (daysSinceLastReview < _daysBetweenReviews) return;
      }

      // Todas las condiciones cumplidas - solicitar reseña
      // Google Play controla sus propias cuotas internamente
      await _inAppReview.requestReview();

      // Guardar fecha de solicitud (no marca como revisado porque el usuario puede cancelar)
      await prefs.setString(_lastReviewDateKey, DateTime.now().toIso8601String());

    } catch (e) {
      // Ignorar errores silenciosamente según mejores prácticas
      debugPrint('Error requesting review: $e');
    }
  }

  /// Abre la página de la app en Play Store para dejar reseña manual
  static Future<void> openStoreListing() async {
    try {
      if (await isAvailable()) {
        await _inAppReview.openStoreListing();
      }
    } catch (e) {
      debugPrint('Error opening store listing: $e');
    }
  }

  /// Marca que el usuario ya ha dejado una reseña
  static Future<void> markAsReviewed() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_hasReviewedKey, true);
  }

  /// Reinicia los contadores (útil para testing)
  static Future<void> resetCounters() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_lastReviewDateKey);
    await prefs.remove(_sessionCountKey);
    await prefs.remove(_hasReviewedKey);
  }
}
