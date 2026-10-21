import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewInstance,
  ScrollViewProps,
  TextInput,
  View,
} from 'react-native';
import { spacing } from '../../theme';

/** Space kept between the focused field and the top of the keyboard. */
const MARGIN = spacing.xl;

const RevealContext = createContext<(() => void) | null>(null);

/** Lets an input ask the surrounding scroll view to bring it above the keyboard. */
export const useRevealOnFocus = () => useContext(RevealContext);

/**
 * ScrollView that keeps the focused field visible above the keyboard.
 * Android draws the app behind the keyboard (edge-to-edge), so the screen does
 * not shrink by itself: this adds room at the bottom and scrolls the field up.
 */
export default function KeyboardAwareScrollView({
  children,
  onScroll,
  ...props
}: ScrollViewProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const reveal = useCallback(() => {
    const top = keyboardTop.current;
    const input = TextInput.State.currentlyFocusedInput();
    if (top == null || !input) {
      return;
    }
    input.measureInWindow((_x, y, _width, height) => {
      const overlap = y + height + MARGIN - top;
      if (overlap > 0) {
        scrollRef.current?.scrollTo({
          y: scrollY.current + overlap,
          animated: true,
        });
      }
    });
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', event => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardHeight(event.endCoordinates.height);
      // Waits for the extra bottom space to be laid out before scrolling.
      requestAnimationFrame(reveal);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [reveal]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll],
  );

  // An input focused while the keyboard is already open has no keyboard
  // event: it calls this itself (see Input).
  const revealSoon = useMemo(() => () => setTimeout(reveal, 50), [reveal]);

  return (
    <RevealContext.Provider value={revealSoon}>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        {children}
        <View style={{ height: keyboardHeight }} />
      </ScrollView>
    </RevealContext.Provider>
  );
}
