import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { calcExpensesByCategory, calcTotals } from './src/budgetMath';
import { BudgetEntry, EntryType, SavingsGoal } from './src/types';

const ENTRIES_KEY = 'budget_entries';
const GOAL_KEY = 'budget_goal';

const categories = ['Housing', 'Food', 'Transport', 'Health', 'Fun', 'Utilities', 'Other'];

const toCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function App() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;

  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [type, setType] = useState<EntryType>('expense');
  const [goalInput, setGoalInput] = useState('1000');
  const [goal, setGoal] = useState<SavingsGoal>({ targetAmount: 1000 });

  useEffect(() => {
    const hydrate = async () => {
      const storedEntries = await AsyncStorage.getItem(ENTRIES_KEY);
      const storedGoal = await AsyncStorage.getItem(GOAL_KEY);

      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }

      if (storedGoal) {
        const parsedGoal = JSON.parse(storedGoal) as SavingsGoal;
        setGoal(parsedGoal);
        setGoalInput(String(parsedGoal.targetAmount));
      }
    };

    hydrate().catch(() => undefined);
  }, []);

  const totals = useMemo(() => calcTotals(entries), [entries]);
  const expenseByCategory = useMemo(() => calcExpensesByCategory(entries), [entries]);
  const progress = goal.targetAmount > 0 ? Math.min((totals.balance / goal.targetAmount) * 100, 100) : 0;

  const saveEntries = async (nextEntries: BudgetEntry[]) => {
    setEntries(nextEntries);
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(nextEntries));
  };

  const addEntry = async () => {
    const parsedAmount = Number(amount);

    if (!title.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const newEntry: BudgetEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: title.trim(),
      amount: parsedAmount,
      category,
      type,
      date: new Date().toISOString(),
    };

    await saveEntries([newEntry, ...entries]);
    setTitle('');
    setAmount('');
  };

  const removeEntry = async (id: string) => {
    await saveEntries(entries.filter((entry) => entry.id !== id));
  };

  const updateGoal = async () => {
    const parsed = Number(goalInput);

    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }

    const nextGoal = { targetAmount: parsed };
    setGoal(nextGoal);
    await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(nextGoal));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined, default: undefined })}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={[
              styles.contentInner,
              isTablet && styles.contentInnerTablet,
              isDesktop && styles.contentInnerDesktop,
            ]}
          >
          <Text style={styles.heading}>Budget Buddy</Text>
          <Text style={styles.subheading}>A simple budgeting app for iOS, Android, and Web.</Text>

          <View style={[styles.summaryGrid, isTablet && styles.summaryGridTablet]}>
            <StatCard title="Income" value={toCurrency(totals.income)} color="#0f766e" />
            <StatCard title="Expenses" value={toCurrency(totals.expenses)} color="#b91c1c" />
            <StatCard title="Balance" value={toCurrency(totals.balance)} color="#1d4ed8" />
          </View>

          <View style={[styles.twoColumnGrid, isTablet && styles.twoColumnGridTablet]}>
            <View style={[styles.card, isTablet && styles.gridCard]}>
            <Text style={styles.cardTitle}>Add Transaction</Text>
            <View style={styles.row}>
              <SegmentButton label="Expense" active={type === 'expense'} onPress={() => setType('expense')} />
              <SegmentButton label="Income" active={type === 'income'} onPress={() => setType('income')} />
            </View>
            <TextInput value={title} onChangeText={setTitle} placeholder="Title" style={styles.input} />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Amount"
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.wrapRow}>
              {categories.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.chip, category === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.actionButton} onPress={addEntry}>
              <Text style={styles.actionButtonText}>Save Transaction</Text>
            </Pressable>
          </View>

          <View style={[styles.card, isTablet && styles.gridCard]}>
            <Text style={styles.cardTitle}>Savings Goal</Text>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="decimal-pad"
              placeholder="Target amount"
              style={styles.input}
            />
            <Pressable style={styles.secondaryButton} onPress={updateGoal}>
              <Text style={styles.secondaryButtonText}>Update Goal</Text>
            </Pressable>
            <Text style={styles.goalText}>
              {toCurrency(Math.max(totals.balance, 0))} / {toCurrency(goal.targetAmount)} ({progress.toFixed(1)}%)
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(progress, 0)}%` }]} />
            </View>
          </View>
          </View>

          <View style={[styles.twoColumnGrid, isTablet && styles.twoColumnGridTablet]}>
            <View style={[styles.card, isTablet && styles.gridCard]}>
            <Text style={styles.cardTitle}>Spending by Category</Text>
            {expenseByCategory.length === 0 ? (
              <Text style={styles.empty}>No expenses yet.</Text>
            ) : (
              expenseByCategory.map(([name, total]) => (
                <View key={name} style={styles.spaceBetween}>
                  <Text style={styles.categoryName}>{name}</Text>
                  <Text style={styles.categoryAmount}>{toCurrency(total)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={[styles.card, isTablet && styles.gridCard]}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            {entries.length === 0 ? (
              <Text style={styles.empty}>Add your first transaction to get started.</Text>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={entries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.entryRow}>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryTitle}>{item.title}</Text>
                      <Text style={styles.entrySub}>{item.category} • {new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.entryRight}>
                      <Text style={[styles.entryAmount, item.type === 'income' ? styles.income : styles.expense]}>
                        {item.type === 'income' ? '+' : '-'}{toCurrency(item.amount)}
                      </Text>
                      <Pressable onPress={() => removeEntry(item.id)}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 56 },
  contentInner: { width: '100%', gap: 16 },
  contentInnerTablet: { alignSelf: 'center', maxWidth: 980 },
  contentInnerDesktop: { maxWidth: 1140 },
  heading: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  subheading: { color: '#334155', marginTop: -8 },
  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryGridTablet: { gap: 12 },
  twoColumnGrid: { gap: 16 },
  twoColumnGridTablet: { flexDirection: 'row', alignItems: 'flex-start' },
  gridCard: { flex: 1 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statTitle: { fontSize: 12, color: '#64748b' },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  row: { flexDirection: 'row', gap: 10 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  segmentButtonActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  segmentButtonText: { color: '#1e293b', fontWeight: '600' },
  segmentButtonTextActive: { color: '#ffffff' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  label: { fontSize: 13, color: '#475569' },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipActive: { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
  chipText: { color: '#334155' },
  chipTextActive: { color: '#1e40af', fontWeight: '600' },
  actionButton: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 11,
  },
  actionButtonText: { color: '#ffffff', fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: { color: '#1e293b', fontWeight: '600' },
  goalText: { color: '#1e293b', fontWeight: '500' },
  progressTrack: { height: 10, borderRadius: 12, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#16a34a' },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryName: { color: '#334155' },
  categoryAmount: { color: '#0f172a', fontWeight: '600' },
  empty: { color: '#64748b' },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
  },
  entryMeta: { flex: 1 },
  entryTitle: { color: '#0f172a', fontWeight: '600' },
  entrySub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', marginLeft: 8 },
  entryAmount: { fontWeight: '700' },
  income: { color: '#15803d' },
  expense: { color: '#b91c1c' },
  deleteText: { color: '#1d4ed8', marginTop: 2, fontSize: 12 },
});
