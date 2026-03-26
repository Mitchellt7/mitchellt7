import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;

/**
 * Desktop budgeting app for Windows (works on any OS with Java 17+).
 * Includes actual and expected income/expense tracking with summary cards.
 */
public class BudgetApp extends JFrame {
    private final LedgerPanel actualPanel = new LedgerPanel("Actual");
    private final LedgerPanel expectedPanel = new LedgerPanel("Expected");

    public BudgetApp() {
        super("Tidy Budget Planner");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setMinimumSize(new Dimension(1100, 700));
        setLocationRelativeTo(null);

        JPanel root = new JPanel(new BorderLayout(16, 16));
        root.setBorder(new EmptyBorder(16, 16, 16, 16));
        root.setBackground(new Color(245, 247, 250));

        JLabel title = new JLabel("Budget Planner");
        title.setFont(new Font("Segoe UI", Font.BOLD, 32));
        title.setForeground(new Color(31, 41, 55));

        JLabel subtitle = new JLabel("Track actual vs expected income and expenses in a clean, simple layout.");
        subtitle.setFont(new Font("Segoe UI", Font.PLAIN, 15));
        subtitle.setForeground(new Color(75, 85, 99));

        JPanel header = new JPanel(new GridLayout(2, 1, 4, 4));
        header.setBackground(root.getBackground());
        header.add(title);
        header.add(subtitle);

        JSplitPane splitPane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, actualPanel, expectedPanel);
        splitPane.setResizeWeight(0.5);
        splitPane.setDividerSize(8);
        splitPane.setBorder(BorderFactory.createEmptyBorder());

        JButton syncButton = createPrimaryButton("Copy Expected → Actual");
        syncButton.addActionListener(e -> {
            actualPanel.copyFrom(expectedPanel);
            refreshAllSummaries();
        });

        JButton clearButton = createSecondaryButton("Clear All");
        clearButton.addActionListener(e -> {
            actualPanel.clearAll();
            expectedPanel.clearAll();
            refreshAllSummaries();
        });

        JPanel controls = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        controls.setBackground(root.getBackground());
        controls.add(clearButton);
        controls.add(syncButton);

        root.add(header, BorderLayout.NORTH);
        root.add(splitPane, BorderLayout.CENTER);
        root.add(controls, BorderLayout.SOUTH);

        setContentPane(root);
        refreshAllSummaries();
    }

    private JButton createPrimaryButton(String text) {
        JButton button = new JButton(text);
        button.setFont(new Font("Segoe UI", Font.BOLD, 13));
        button.setBackground(new Color(37, 99, 235));
        button.setForeground(Color.WHITE);
        button.setFocusPainted(false);
        button.setBorder(new EmptyBorder(8, 14, 8, 14));
        return button;
    }

    private JButton createSecondaryButton(String text) {
        JButton button = new JButton(text);
        button.setFont(new Font("Segoe UI", Font.BOLD, 13));
        button.setBackground(new Color(229, 231, 235));
        button.setForeground(new Color(17, 24, 39));
        button.setFocusPainted(false);
        button.setBorder(new EmptyBorder(8, 14, 8, 14));
        return button;
    }

    private void refreshAllSummaries() {
        actualPanel.updateSummary();
        expectedPanel.updateSummary();
    }

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {
            // Fallback to default LookAndFeel.
        }

        SwingUtilities.invokeLater(() -> {
            BudgetApp app = new BudgetApp();
            app.setVisible(true);
        });
    }
}

class LedgerPanel extends JPanel {
    private final DefaultTableModel incomeModel;
    private final DefaultTableModel expenseModel;
    private final JTable incomeTable;
    private final JTable expenseTable;
    private final JLabel incomeValue = new JLabel("$0.00");
    private final JLabel expenseValue = new JLabel("$0.00");
    private final JLabel balanceValue = new JLabel("$0.00");

    LedgerPanel(String title) {
        super(new BorderLayout(12, 12));
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(229, 231, 235)),
                new EmptyBorder(14, 14, 14, 14)
        ));

        JLabel heading = new JLabel(title + " Budget");
        heading.setFont(new Font("Segoe UI", Font.BOLD, 22));
        heading.setForeground(new Color(17, 24, 39));

        add(heading, BorderLayout.NORTH);

        incomeModel = createModel();
        expenseModel = createModel();
        incomeTable = createTable(incomeModel);
        expenseTable = createTable(expenseModel);

        JPanel tables = new JPanel(new GridLayout(2, 1, 12, 12));
        tables.setBackground(Color.WHITE);
        tables.add(buildSection("Income", incomeTable, incomeModel, new Color(220, 252, 231)));
        tables.add(buildSection("Expenses", expenseTable, expenseModel, new Color(254, 226, 226)));

        JPanel summary = buildSummaryPanel();

        add(tables, BorderLayout.CENTER);
        add(summary, BorderLayout.SOUTH);
    }

    private DefaultTableModel createModel() {
        return new DefaultTableModel(new Object[]{"Category", "Amount"}, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return true;
            }
        };
    }

    private JTable createTable(DefaultTableModel model) {
        JTable table = new JTable(model);
        table.setRowHeight(24);
        table.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        table.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 13));
        table.getTableHeader().setBackground(new Color(243, 244, 246));
        table.getTableHeader().setReorderingAllowed(false);
        return table;
    }

    private JPanel buildSection(String label, JTable table, DefaultTableModel model, Color tone) {
        JPanel panel = new JPanel(new BorderLayout(8, 8));
        panel.setBackground(tone);
        panel.setBorder(new EmptyBorder(10, 10, 10, 10));

        JLabel sectionLabel = new JLabel(label);
        sectionLabel.setFont(new Font("Segoe UI", Font.BOLD, 16));

        JScrollPane scrollPane = new JScrollPane(table);
        scrollPane.setPreferredSize(new Dimension(350, 170));

        JButton addButton = new JButton("Add Row");
        addButton.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        addButton.addActionListener(e -> {
            model.addRow(new Object[]{"", "0"});
            updateSummary();
        });

        JButton removeButton = new JButton("Remove Selected");
        removeButton.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        removeButton.addActionListener(e -> {
            int selected = table.getSelectedRow();
            if (selected >= 0) {
                model.removeRow(selected);
                updateSummary();
            }
        });

        model.addTableModelListener(e -> updateSummary());

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        actions.setBackground(tone);
        actions.add(addButton);
        actions.add(removeButton);

        panel.add(sectionLabel, BorderLayout.NORTH);
        panel.add(scrollPane, BorderLayout.CENTER);
        panel.add(actions, BorderLayout.SOUTH);
        return panel;
    }

    private JPanel buildSummaryPanel() {
        JPanel panel = new JPanel(new GridLayout(1, 3, 10, 10));
        panel.setBackground(Color.WHITE);
        panel.add(summaryCard("Total Income", incomeValue, new Color(209, 250, 229)));
        panel.add(summaryCard("Total Expenses", expenseValue, new Color(254, 226, 226)));
        panel.add(summaryCard("Balance", balanceValue, new Color(219, 234, 254)));
        return panel;
    }

    private JPanel summaryCard(String label, JLabel value, Color color) {
        JPanel card = new JPanel(new GridLayout(2, 1));
        card.setBackground(color);
        card.setBorder(new EmptyBorder(8, 10, 8, 10));

        JLabel title = new JLabel(label);
        title.setFont(new Font("Segoe UI", Font.BOLD, 13));
        value.setFont(new Font("Segoe UI", Font.BOLD, 20));

        card.add(title);
        card.add(value);
        return card;
    }

    void updateSummary() {
        double income = sumModel(incomeModel);
        double expenses = sumModel(expenseModel);
        double balance = income - expenses;

        incomeValue.setText(formatMoney(income));
        expenseValue.setText(formatMoney(expenses));
        balanceValue.setText(formatMoney(balance));
        balanceValue.setForeground(balance < 0 ? new Color(185, 28, 28) : new Color(22, 101, 52));
    }

    private double sumModel(DefaultTableModel model) {
        double total = 0;
        for (int i = 0; i < model.getRowCount(); i++) {
            String raw = String.valueOf(model.getValueAt(i, 1)).replace("$", "").replace(",", "").trim();
            if (raw.isEmpty()) {
                continue;
            }
            try {
                total += Double.parseDouble(raw);
            } catch (NumberFormatException ignored) {
                // Ignore invalid rows and keep UI responsive.
            }
        }
        return total;
    }

    private String formatMoney(double value) {
        return String.format("$%,.2f", value);
    }

    void clearAll() {
        incomeModel.setRowCount(0);
        expenseModel.setRowCount(0);
    }

    void copyFrom(LedgerPanel source) {
        copyModel(source.incomeModel, this.incomeModel);
        copyModel(source.expenseModel, this.expenseModel);
    }

    private void copyModel(DefaultTableModel from, DefaultTableModel to) {
        to.setRowCount(0);
        for (int i = 0; i < from.getRowCount(); i++) {
            to.addRow(new Object[]{from.getValueAt(i, 0), from.getValueAt(i, 1)});
        }
    }
}
