import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gender, CEFRLevel, CATEGORIES } from '@/types';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const FILTER_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1'];

interface FilterChipsProps {
  selectedLevel?: CEFRLevel;
  selectedGender?: Gender;
  selectedCategory?: string;
  onLevelChange: (level?: CEFRLevel) => void;
  onGenderChange: (gender?: Gender) => void;
  onCategoryChange: (category?: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  'persoenliche-angaben': 'Thông tin cá nhân',
  'familie-freunde': 'Gia đình & Bạn bè',
  'wohnen': 'Nhà ở',
  'essen-trinken': 'Ăn & Uống',
  'einkaufen': 'Mua sắm',
  'koerper-gesundheit': 'Cơ thể & Sức khỏe',
  'arbeit-beruf': 'Công việc & Nghề nghiệp',
  'schule-ausbildung': 'Trường học & Đào tạo',
  'freizeit-hobbys': 'Giải trí & Sở thích',
  'reisen-verkehr': 'Du lịch & Giao thông',
  'natur-wetter': 'Thiên nhiên & Thời tiết',
  'medien-kommunikation': 'Truyền thông & Liên lạc',
};

// ── Dropdown Button ──────────────────────────────────────
interface DropdownButtonProps {
  label: string;
  value?: string;
  accentColor: string;
  accentDim: string;
  onPress: () => void;
}

function DropdownButton({ label, value, accentColor, accentDim, onPress }: DropdownButtonProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const active = !!value;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.dropdownBtn,
        active && { backgroundColor: accentDim, borderColor: accentColor + '40' },
      ]}
    >
      <Text
        style={[styles.dropdownBtnText, active && { color: accentColor }]}
        numberOfLines={1}
      >
        {value || label}
      </Text>
      <Ionicons
        name="chevron-down"
        size={14}
        color={active ? accentColor : colors.text.tertiary}
      />
    </TouchableOpacity>
  );
}

// ── Dropdown Modal ───────────────────────────────────────
interface DropdownOption {
  key: string;
  label: string;
  color?: string;
}

interface DropdownModalProps {
  visible: boolean;
  title: string;
  options: DropdownOption[];
  selectedKey?: string;
  accentColor: string;
  onSelect: (key: string | undefined) => void;
  onClose: () => void;
}

function DropdownModal({ visible, title, options, selectedKey, accentColor, onSelect, onClose }: DropdownModalProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {/* "All" option to clear */}
            <TouchableOpacity
              onPress={() => { onSelect(undefined); onClose(); }}
              activeOpacity={0.7}
              style={[styles.option, !selectedKey && styles.optionActive]}
            >
              <Text style={[styles.optionText, !selectedKey && { color: accentColor }]}>
                Tất cả
              </Text>
              {!selectedKey && (
                <Ionicons name="checkmark" size={18} color={accentColor} />
              )}
            </TouchableOpacity>

            {options.map((opt) => {
              const isSelected = selectedKey === opt.key;
              const optColor = opt.color || accentColor;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => { onSelect(opt.key); onClose(); }}
                  activeOpacity={0.7}
                  style={[styles.option, isSelected && styles.optionActive]}
                >
                  <Text style={[styles.optionText, isSelected && { color: optColor }]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={optColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Component ───────────────────────────────────────
export default function FilterChips({
  selectedLevel,
  selectedGender,
  selectedCategory,
  onLevelChange,
  onGenderChange,
  onCategoryChange,
}: FilterChipsProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [openDropdown, setOpenDropdown] = useState<'level' | 'gender' | 'category' | null>(null);
  const hasFilters = selectedLevel || selectedGender || selectedCategory;

  const genderOptions_ = useMemo(() => [
    { value: 'masculine' as Gender, label: 'der (Nam)', color: colors.pastel.sky.base },
    { value: 'feminine' as Gender, label: 'die (Nữ)', color: colors.pastel.rose.base },
    { value: 'neuter' as Gender, label: 'das (Trung)', color: colors.pastel.mint.base },
  ], [colors]);

  const selectedGenderLabel = genderOptions_.find((g) => g.value === selectedGender)?.label;
  const selectedCategoryLabel = selectedCategory ? (CATEGORY_LABELS[selectedCategory] || selectedCategory) : undefined;

  const levelOptions: DropdownOption[] = FILTER_LEVELS.map((l) => ({ key: l, label: l }));
  const genderOptions: DropdownOption[] = genderOptions_.map((g) => ({
    key: g.value,
    label: g.label,
    color: g.color,
  }));
  const categoryOptions: DropdownOption[] = CATEGORIES.map((c) => ({
    key: c,
    label: CATEGORY_LABELS[c] || c,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Level dropdown */}
        <DropdownButton
          label="Trình độ"
          value={selectedLevel}
          accentColor={colors.pastel.lavender.base}
          accentDim={colors.pastel.lavender.dim}
          onPress={() => setOpenDropdown('level')}
        />

        {/* Gender dropdown */}
        <DropdownButton
          label="Giống"
          value={selectedGenderLabel}
          accentColor={colors.pastel.sky.base}
          accentDim={colors.pastel.sky.dim}
          onPress={() => setOpenDropdown('gender')}
        />

        {/* Category dropdown */}
        <DropdownButton
          label="Chủ đề"
          value={selectedCategoryLabel}
          accentColor={colors.pastel.peach.base}
          accentDim={colors.pastel.peach.dim}
          onPress={() => setOpenDropdown('category')}
        />

        {/* Clear button */}
        {hasFilters && (
          <TouchableOpacity
            onPress={() => {
              onLevelChange(undefined);
              onGenderChange(undefined);
              onCategoryChange(undefined);
            }}
            activeOpacity={0.7}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={16} color={colors.pastel.rose.base} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={openDropdown === 'level'}
        title="Trình độ"
        options={levelOptions}
        selectedKey={selectedLevel}
        accentColor={colors.pastel.lavender.base}
        onSelect={(key) => onLevelChange(key as CEFRLevel | undefined)}
        onClose={() => setOpenDropdown(null)}
      />
      <DropdownModal
        visible={openDropdown === 'gender'}
        title="Giống từ"
        options={genderOptions}
        selectedKey={selectedGender}
        accentColor={colors.pastel.sky.base}
        onSelect={(key) => onGenderChange(key as Gender | undefined)}
        onClose={() => setOpenDropdown(null)}
      />
      <DropdownModal
        visible={openDropdown === 'category'}
        title="Chủ đề"
        options={categoryOptions}
        selectedKey={selectedCategory}
        accentColor={colors.pastel.peach.base}
        onSelect={(key) => onCategoryChange(key)}
        onClose={() => setOpenDropdown(null)}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  /* ── Dropdown Button ─────────── */
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.secondary,
  },

  /* ── Clear Button ────────────── */
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.pastel.rose.dim,
    borderWidth: 1,
    borderColor: colors.pastel.rose.base + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Modal Overlay ───────────── */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg.b1,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '60%',
    paddingBottom: 30,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },

  /* ── Options List ────────────── */
  optionsList: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  optionActive: {
    backgroundColor: colors.bg.b3,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.secondary,
  },
});
