import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useRotationGesture, useSimultaneousGestures } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { scheduleOnUI } from 'react-native-worklets';

import { useAppTheme } from '../app-theme';
import { ActionButton, Icon } from '../app-ui';
import { getChallengeStatus, StatusLabel, statusIcons, statusLabels, useStatusColors, type ChallengeStatus } from './challenge-status';
import { exercises, getExerciseTitle, startNodeId } from './exercises';
import { board, fitBoard, keepBoardInReach, transformAt, type Camera, type Point, type Size } from './map-camera';
import { webCenter, webLabels, webPositions } from './web-layout';

const hitSize = 72;

type TreeMapProps = {
  completedIds: readonly string[] | null;
  onOpen: (id: string) => void;
  onReset: () => void;
  resetDisabled: boolean;
};

const root = { id: startNodeId, title: 'Início', point: webCenter };
const labels = [
  ...webLabels,
  { title: root.title, x: root.point.x, y: root.point.y + 40 },
];

function MapNode({ point, title, status, onPress }: {
  point: Point;
  title: string;
  status: ChallengeStatus;
  onPress: () => void;
}) {
  const { foreground, background } = useStatusColors(status);
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${statusLabels[status]}`}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.hitTarget, {
        left: point.x - hitSize / 2,
        top: point.y - hitSize / 2,
        borderColor: focused ? colors.focus : 'transparent',
      }]}
    >
      {({ pressed }) => (
        <View style={[styles.marker, status === 'start' && styles.rootMarker, {
          backgroundColor: pressed ? foreground : background,
          borderColor: foreground,
        }]}>
          <Icon name={statusIcons[status]} color={pressed ? background : foreground} size={27} />
        </View>
      )}
    </Pressable>
  );
}

export function TreeMap({ completedIds, onOpen, onReset, resetDisabled }: TreeMapProps) {
  const { colors } = useAppTheme();
  const [showList, setShowList] = useState(false);
  const viewport = useSharedValue<Size>({ width: 0, height: 0 });
  const camera = useSharedValue<Camera>({ x: 0, y: 0, zoom: 1, angle: 0 });
  const pinchPoint = useSharedValue<Point | null>(null);

  const pan = usePanGesture({
    minDistance: 6,
    onUpdate: ({ changeX, changeY, numberOfPointers }) => {
      if (pinchPoint.value || numberOfPointers !== 1) return;

      const current = camera.value;
      camera.value = keepBoardInReach({ ...current, x: current.x + changeX, y: current.y + changeY }, viewport.value);
    },
  });

  const pinch = usePinchGesture({
    onActivate: ({ focalX, focalY }) => {
      pinchPoint.value = { x: focalX, y: focalY };
    },
    onUpdate: ({ focalX, focalY, scaleChange, numberOfPointers }) => {
      const previous = pinchPoint.value;
      if (!previous || numberOfPointers < 2) return;

      const focal = { x: focalX, y: focalY };
      const size = viewport.value;
      camera.value = keepBoardInReach(transformAt(camera.value, previous, focal, scaleChange, 0, size), size);
      pinchPoint.value = focal;
    },
    onFinalize: () => { pinchPoint.value = null; },
  });

  const rotation = useRotationGesture({
    onUpdate: ({ anchorX, anchorY, rotationChange, numberOfPointers }) => {
      if (numberOfPointers < 2) return;

      const anchor = pinchPoint.value ?? { x: anchorX, y: anchorY };
      const size = viewport.value;
      camera.value = keepBoardInReach(transformAt(camera.value, anchor, anchor, 1, rotationChange, size), size);
    },
  });

  const gestures = useSimultaneousGestures(pan, pinch, rotation);
  const boardStyle = useAnimatedStyle(() => ({
    opacity: viewport.value.width > 0 ? 1 : 0,
    transform: [
      { translateX: camera.value.x }, { translateY: camera.value.y },
      { rotateZ: `${camera.value.angle}rad` }, { scale: camera.value.zoom },
    ],
  }));

  function handleLayout({ nativeEvent: { layout } }: LayoutChangeEvent) {
    const { width, height } = layout;
    if (width <= 0 || height <= 0) return;

    scheduleOnUI(() => {
      'worklet';
      if (viewport.value.width === width && viewport.value.height === height) return;
      viewport.value = { width, height };
      camera.value = fitBoard(viewport.value);
    });
  }

  function changeZoom(multiplier: number) {
    scheduleOnUI(() => {
      'worklet';
      const size = viewport.value;
      const { width, height } = size;
      const center = { x: width / 2, y: height / 2 };
      camera.value = keepBoardInReach(transformAt(camera.value, center, center, multiplier, 0, size), size);
    });
  }

  function resetView() {
    scheduleOnUI(() => {
      'worklet';
      camera.value = fitBoard(viewport.value);
    });
  }

  const nodes = exercises.map((exercise) => ({
    ...exercise,
    title: getExerciseTitle(exercise),
    status: getChallengeStatus(exercise, completedIds),
  }));

  return (
    <View style={styles.map}>
      <View style={[styles.map, showList && styles.hidden]} accessibilityElementsHidden={showList}
        importantForAccessibility={showList ? 'no-hide-descendants' : 'auto'}>
        <GestureDetector gesture={gestures}>
          <View style={styles.viewport} onLayout={handleLayout}>
            <Animated.View style={[styles.board, boardStyle]}>
              <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
                <Svg width={board.width} height={board.height} accessible={false}>
                  {nodes.map(({ id, prerequisiteId, status }) => {
                    const from = webPositions.get(prerequisiteId);
                    const to = webPositions.get(id);
                    if (!from || !to) return null;

                    return <Line key={id} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={status === 'completed' ? colors.completed : colors.connector} strokeWidth={4} />;
                  })}
                </Svg>
              </View>
              {labels.map(({ title, x, y }) => (
                <View key={title} pointerEvents="none" importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden style={[styles.mapLabel, { left: x - 145, top: y }]}>
                  <Text allowFontScaling={false} style={[styles.mapLabelText, { color: colors.muted, backgroundColor: colors.background }]}>
                    {title}
                  </Text>
                </View>
              ))}
              <MapNode title={root.title} point={root.point} status="start" onPress={() => onOpen(root.id)} />
              {nodes.map(({ id, title, status }) => {
                const point = webPositions.get(id);
                return point && <MapNode key={id} title={title} point={point} status={status} onPress={() => onOpen(id)} />;
              })}
            </Animated.View>
          </View>
        </GestureDetector>
      </View>

      {showList && (
        <ScrollView style={styles.map} contentContainerStyle={styles.list}>
          {[{ ...root, status: 'start' as const }, ...nodes].map(({ id, title, status }) => (
            <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${title}. ${statusLabels[status]}`}
              onPress={() => onOpen(id)} style={({ pressed }) => [styles.listItem, {
                borderBottomColor: colors.border,
                backgroundColor: pressed ? colors.pressed : 'transparent',
              }]}>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
                <StatusLabel status={status} />
              </View>
              <Icon name="chevron" color={colors.muted} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={[styles.controls, { borderTopColor: colors.border }]}>
        <ActionButton accessibilityLabel="Reiniciar progresso" icon="reset" onPress={onReset}
          variant="quiet" disabled={resetDisabled} />
        <View style={[styles.zoomControls, !showList && { backgroundColor: colors.surface }]}>
          {!showList && (
            <>
              <ActionButton accessibilityLabel="Centralizar mapa" icon="center" onPress={resetView} variant="quiet" />
              <ActionButton accessibilityLabel="Reduzir zoom" icon="minus" onPress={() => changeZoom(1 / 1.3)} variant="quiet" />
              <ActionButton accessibilityLabel="Aumentar zoom" icon="plus" onPress={() => changeZoom(1.3)} variant="quiet" />
            </>
          )}
        </View>
        <ActionButton accessibilityLabel={showList ? 'Exibir mapa de desafios' : 'Exibir lista de desafios'}
          icon={showList ? 'web' : 'list'} onPress={() => setShowList((current) => !current)} variant="quiet" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  hidden: { display: 'none' },
  viewport: { flex: 1, overflow: 'hidden' },
  board: { width: board.width, height: board.height, position: 'absolute', left: 0, top: 0, transformOrigin: 'left top' },
  mapLabel: { position: 'absolute', width: 290 },
  mapLabelText: { alignSelf: 'center', paddingHorizontal: 8, fontSize: 34, lineHeight: 40, fontWeight: '600', textAlign: 'center' },
  hitTarget: { position: 'absolute', width: hitSize, height: hitSize, borderWidth: 2, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  marker: { width: 62, height: 62, borderWidth: 2, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  rootMarker: { width: 70, height: 70, borderRadius: 35 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: 1 },
  zoomControls: { flexDirection: 'row', borderRadius: 14, gap: 4 },
  list: { paddingHorizontal: 16 },
  listItem: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, padding: 12 },
  itemText: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
});
