import { CameraView } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../app-theme';
import { ActionButton, Icon } from '../app-ui';
import { getExerciseTitle, type ExerciseNode } from './exercises';
import { PoseSkeleton } from './pose-camera-preview';
import { useChallengeCamera } from './use-challenge-camera';
import { useChallengeTracking } from './use-challenge-tracking';

type ChallengeCameraProps = {
  node: ExerciseNode;
  saving: boolean;
  saveFailed: boolean;
  onBack: () => void;
  onComplete: () => void;
};

const motionHints = {
  squat: {
    positioning: 'Apoie o celular, fique em pé de lado e mantenha o quadril, o joelho e o tornozelo visíveis.',
    ready: 'Desça devagar, segure um instante e volte à posição em pé.',
    active: 'Volte à posição em pé.',
  },
  'push-up': {
    positioning: 'Posicione-se de frente para o celular, com a cabeça mais perto dele. Apoie as mãos no chão e estenda os braços. Mantenha as duas mãos e os dois cotovelos no quadro.',
    ready: 'Dobre os dois cotovelos até o painel pedir para subir.',
    active: 'Estenda os dois braços para completar a flexão.',
  },
  crunch: {
    positioning: 'Posicione-se de lado para o celular, com a cabeça e os pés em lados opostos da imagem. Deite-se de costas, apoie os ombros no chão e dobre os joelhos.',
    ready: 'Eleve os ombros do chão para iniciar o abdominal.',
    active: 'Apoie os ombros no chão para completar o abdominal.',
  },
};

export function ChallengeCamera({ node, saving, saveFailed, onBack, onComplete }: ChallengeCameraProps) {
  const { colors } = useAppTheme();
  const exercise = Platform.OS === 'android' ? node.tracking : undefined;
  const target = exercise ? node.repetitions : undefined;
  const { camera, active, permission, cameraFailed, checkingPermission, showingCamera,
    cameraReady, setCameraReady, failCamera, retryCamera } = useChallengeCamera();
  const { progress, goalReached, connected, serverUrl, serverError, landmarks, analysisFps, previewAspect, reconnect } =
    useChallengeTracking({ exercise, target, enabled: showingCamera && cameraReady, camera, active, failCamera });
  const movementHint = exercise ? motionHints[exercise][progress.status] : '';
  const trackingHint = goalReached ? 'Meta atingida. Você pode finalizar o desafio.'
    : serverError || (!serverUrl ? 'Abra o projeto pelo QR code do Expo Go para usar a contagem.'
      : connected ? movementHint : 'Preparando a contagem no PC…');

  return (
    <View style={styles.screen} onLayout={({ nativeEvent: { layout } }) => {
      if (layout.height > 0) previewAspect.current = layout.width / layout.height;
    }}>
      <StatusBar style="light" />
      {showingCamera && (
        <>
          <CameraView ref={camera} facing="front" mirror={target !== undefined} animateShutter={false}
            pictureSize={target === undefined ? undefined : '640x480'} style={StyleSheet.absoluteFill}
            onCameraReady={() => setCameraReady(true)} onMountError={failCamera} />
          {!goalReached && <PoseSkeleton landmarks={landmarks} />}
        </>
      )}
      <SafeAreaView style={styles.screenControls}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ActionButton accessibilityLabel="Voltar aos detalhes" icon="back" variant="secondary" onPress={onBack} />
            <View style={[styles.panel, styles.titlePanel]}>
              <Text accessibilityRole="header" style={styles.title}>{getExerciseTitle(node)}</Text>
              {analysisFps !== null && !goalReached && (
                <Text style={styles.analysisRate}>{analysisFps.toFixed(1).replace('.', ',')} FPS de análise</Text>
              )}
            </View>
          </View>

          {(!permission?.granted || cameraFailed) && (
            <View style={[styles.panel, styles.previewMessage]}>
              {checkingPermission ? <ActivityIndicator color={colors.completed} /> : <Icon name="camera" color="#FFF" size={32} />}
              <Text accessibilityLiveRegion="polite" style={styles.cameraHint}>
                {cameraFailed
                  ? target === undefined ? 'Não foi possível abrir a câmera.' : 'Não foi possível iniciar a contagem pela câmera.'
                  : checkingPermission
                    ? 'Verificando acesso à câmera…'
                    : 'Permita o acesso à câmera para acompanhar o exercício.'}
              </Text>
              {!checkingPermission && (
                <ActionButton onPress={retryCamera} variant="secondary" label={permission?.canAskAgain === false && !permission.granted
                  ? 'Abrir ajustes do celular'
                  : cameraFailed ? 'Tentar novamente' : 'Permitir câmera'} />
              )}
            </View>
          )}
          <View style={[styles.panel, styles.footer]}>
            {target === undefined ? (
              <Text style={styles.cameraHint}>{node.description} Conclusão manual.</Text>
            ) : (
              <>
                <Text accessibilityLiveRegion="polite" style={styles.count}>{progress.repetitions} de {target}</Text>
                <Text style={styles.cameraHint}>{trackingHint}</Text>
                {connected && !goalReached && !!progress.detail && <Text style={styles.measurement}>{progress.detail}</Text>}
                {!goalReached && serverError !== '' && (
                  <ActionButton label="Tentar reconectar" variant="secondary" onPress={reconnect} />
                )}
              </>
            )}
            {saveFailed && <Text accessibilityRole="alert" style={styles.cameraHint}>Falha ao salvar. Tente concluir novamente.</Text>}
            {(target === undefined || goalReached) && (
              <ActionButton label={saving ? 'Salvando…' : saveFailed ? 'Tentar salvar novamente' : 'Finalizar desafio'}
                icon="check" disabled={saving} onPress={onComplete} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101417' },
  screenControls: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center', justifyContent: 'space-between', padding: 12, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  panel: { backgroundColor: 'rgba(12, 17, 19, 0.78)', borderRadius: 14, padding: 12 },
  titlePanel: { flexShrink: 1, minHeight: 48, justifyContent: 'center' },
  title: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  analysisRate: { color: '#C9E1D7', fontSize: 12, marginTop: 2 },
  previewMessage: { alignItems: 'center', gap: 12 },
  footer: { gap: 8 },
  count: { color: '#FFF', fontSize: 30, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  cameraHint: { color: '#EEF3F0', fontSize: 14, lineHeight: 19, textAlign: 'center' },
  measurement: { color: '#C9E1D7', fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
