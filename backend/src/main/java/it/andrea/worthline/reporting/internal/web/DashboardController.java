package it.andrea.worthline.reporting.internal.web;

import it.andrea.worthline.transactions.TransactionDashboard;
import it.andrea.worthline.wealth.WealthDashboard;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Each resource belongs to one independently loaded dashboard card. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final WealthDashboard wealth;
    private final TransactionDashboard transactions;

    @GetMapping("/wealth")
    public WealthDashboard.WealthCard wealth(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month,
            @RequestParam(defaultValue = "6") @Min(3) @Max(12) int periods) {
        return wealth.wealth(month, periods);
    }

    @GetMapping("/allocation")
    public WealthDashboard.AllocationCard allocation(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return wealth.allocation(month);
    }

    @GetMapping("/current-situation")
    public WealthDashboard.CurrentSituation currentSituation(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return wealth.currentSituation(month);
    }

    @GetMapping("/income")
    public TransactionDashboard.Metric income(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return transactions.income(month);
    }

    @GetMapping("/expenses")
    public TransactionDashboard.Metric expenses(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return transactions.expenses(month);
    }

    @GetMapping("/cash-flow")
    public TransactionDashboard.Metric cashFlow(@RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return transactions.cashFlow(month);
    }
}
