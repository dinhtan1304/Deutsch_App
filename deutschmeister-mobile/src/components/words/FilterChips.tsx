import { ScrollView, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gender, CEFRLevel, CATEGORIES, LEVELS } from '@/types';

interface FilterChipsProps {
  selectedLevel?: CEFRLevel;
  selectedGender?: Gender;
  selectedCategory?: string;
  onLevelChange: (level?: CEFRLevel) => void;
  onGenderChange: (gender?: Gender) => void;
  onCategoryChange: (category?: string) => void;
}

interface ChipProps {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}

function Chip({ label, active, color, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 flex-row items-center rounded-full px-3.5 py-2 ${
        active
          ? 'border border-primary-500 bg-primary-500/20'
          : 'border border-dark-border bg-dark-card'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          active ? 'text-primary-400' : 'text-gray-400'
        }`}
        style={active && color ? { color } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const GENDER_OPTIONS: { value: Gender; label: string; article: string; color: string }[] = [
  { value: 'masculine', label: 'der', article: 'der', color: '#3B82F6' },
  { value: 'feminine', label: 'die', article: 'die', color: '#EC4899' },
  { value: 'neuter', label: 'das', article: 'das', color: '#10B981' },
];

const CATEGORY_LABELS: Record<string, string> = {
  animals: 'Animals',
  body: 'Body',
  clothing: 'Clothing',
  colors: 'Colors',
  education: 'Education',
  family: 'Family',
  food: 'Food',
  health: 'Health',
  home: 'Home',
  nature: 'Nature',
  numbers: 'Numbers',
  occupations: 'Jobs',
  places: 'Places',
  sports: 'Sports',
  technology: 'Tech',
  time: 'Time',
  transport: 'Transport',
  travel: 'Travel',
  weather: 'Weather',
  other: 'Other',
};

export default function FilterChips({
  selectedLevel,
  selectedGender,
  selectedCategory,
  onLevelChange,
  onGenderChange,
  onCategoryChange,
}: FilterChipsProps) {
  const hasFilters = selectedLevel || selectedGender || selectedCategory;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-2"
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {/* Clear filters */}
      {hasFilters && (
        <Pressable
          onPress={() => {
            onLevelChange(undefined);
            onGenderChange(undefined);
            onCategoryChange(undefined);
          }}
          className="mr-2 flex-row items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2"
        >
          <Ionicons name="close-circle" size={14} color="#EF4444" />
          <Text className="ml-1 text-sm font-medium text-red-400">Clear</Text>
        </Pressable>
      )}

      {/* Level chips */}
      {LEVELS.map((level) => (
        <Chip
          key={`level-${level}`}
          label={level}
          active={selectedLevel === level}
          onPress={() => onLevelChange(selectedLevel === level ? undefined : level)}
        />
      ))}

      {/* Gender chips */}
      {GENDER_OPTIONS.map((g) => (
        <Chip
          key={`gender-${g.value}`}
          label={g.label}
          active={selectedGender === g.value}
          color={selectedGender === g.value ? g.color : undefined}
          onPress={() => onGenderChange(selectedGender === g.value ? undefined : g.value)}
        />
      ))}

      {/* Category chips */}
      {CATEGORIES.map((cat) => (
        <Chip
          key={`cat-${cat}`}
          label={CATEGORY_LABELS[cat] || cat}
          active={selectedCategory === cat}
          onPress={() => onCategoryChange(selectedCategory === cat ? undefined : cat)}
        />
      ))}
    </ScrollView>
  );
}
