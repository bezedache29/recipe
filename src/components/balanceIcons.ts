import { Croissant, Leaf, LucideIcon, Scale } from 'lucide-react-native';
import { Balance } from '../types';

export const balanceIcons: Record<Balance, LucideIcon> = {
  healthy: Leaf,
  normal: Scale,
  rich: Croissant,
};
