import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Gift,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CheckCircle,
} from 'lucide-react-native';
import { colors, spacing, radius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface RewardedAdModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  rewardType: 'pdf_download' | 'premium_template' | 'ai_generation';
}

export function RewardedAdModal({ visible, onClose, onRewardEarned, rewardType }: RewardedAdModalProps) {
  const [adProgress, setAdProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [countdownText, setCountdownText] = useState('5');

  useEffect(() => {
    if (visible && isPlaying && !adCompleted) {
      const duration = 5000;
      const startTime = Date.now();
      const endTime = startTime + duration;

      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        const progress = Math.min(100, ((duration - remaining) / duration) * 100);
        setAdProgress(progress);

        const secondsLeft = Math.ceil(remaining / 1000);
        setCountdownText(secondsLeft > 0 ? `${secondsLeft}` : 'Done!');

        if (remaining <= 0) {
          clearInterval(interval);
          setAdCompleted(true);
          setIsPlaying(false);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [visible, isPlaying, adCompleted]);

  const handleClose = () => {
    setAdProgress(0);
    setAdCompleted(false);
    setIsPlaying(true);
    setCountdownText('5');
    onClose();
  };

  const handleClaimReward = () => {
    onRewardEarned();
    handleClose();
  };

  const getRewardTitle = () => {
    switch (rewardType) {
      case 'pdf_download':
        return 'Download PDF';
      case 'premium_template':
        return 'Unlock Premium Template';
      case 'ai_generation':
        return 'AI Summary Generation';
      default:
        return 'Unlock Feature';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {adCompleted ? (
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
              style={styles.successContainer}
            >
              <View style={styles.successIconBg}>
                <CheckCircle color={colors.success} size={48} />
              </View>
              <Text style={styles.successTitle}>Reward Earned!</Text>
              <Text style={styles.successDesc}>
                Thank you for watching. Your {getRewardTitle()} is now available.
              </Text>
              <TouchableOpacity style={styles.claimBtn} onPress={handleClaimReward}>
                <LinearGradient
                  colors={[colors.success, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.claimGradient}
                >
                  <Gift color={colors.white} size={18} />
                  <Text style={styles.claimText}>Claim Reward</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.skipHint} onPress={handleClose}>
                No thanks, maybe later
              </Text>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Sponsored Ad</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <X color={colors.textMuted} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.adContainer}>
                <View style={styles.adPlaceholder}>
                  <LinearGradient
                    colors={['rgba(37, 99, 235, 0.2)', 'rgba(14, 165, 233, 0.15)']}
                    style={styles.adPlaceholderGradient}
                  >
                    <View style={styles.adContent}>
                      <View style={styles.adIconBg}>
                        <Gift color={colors.primaryLight} size={32} />
                      </View>
                      <Text style={styles.adTitle}>Premium Service Ad</Text>
                      <Text style={styles.adSubtitle}>Your dream job awaits!</Text>
                      <View style={styles.fakeAdBadge}>
                        <Text style={styles.fakeAdBadgeText}>AD</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${adProgress}%` }]} />
                </View>
                <View style={styles.countdownContainer}>
                  <Clock color={colors.textSecondary} size={14} />
                  <Text style={styles.countdownText}>
                    {countdownText} {countdownText !== 'Done!' ? 'seconds remaining' : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause color={colors.textSecondary} size={20} />
                  ) : (
                    <Play color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX color={colors.textSecondary} size={20} />
                  ) : (
                    <Volume2 color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Watch the ad to earn your reward
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - 48,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adContainer: {
    padding: spacing.lg,
    minHeight: 280,
  },
  adPlaceholder: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  adPlaceholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  adContent: {
    alignItems: 'center',
  },
  adIconBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  adTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  adSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  fakeAdBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fakeAdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  countdownText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  successContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIconBg: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.successGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  successDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  claimBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '100%',
    marginBottom: spacing.md,
  },
  claimGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  claimText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  skipHint: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
