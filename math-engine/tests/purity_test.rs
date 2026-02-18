// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — WASM Purity Tests (Phase 6.2)
// ═══════════════════════════════════════════════════════════════════
//
// These tests verify Anti-Logic Drift Pillar 2: Same Input → Same Output.
// Every WASM function must be PURE — no I/O, no timestamps, no randomness.
//
// If any of these tests fail, the math engine has drifted.
// Use `git bisect run cargo test` to find the breaking commit.
// ═══════════════════════════════════════════════════════════════════

use math_validator::*;

// ─── Arithmetic Purity ───────────────────────────────────────────────

#[test]
fn purity_arithmetic_addition_always_same() {
    // Same input must ALWAYS produce same output
    for _ in 0..100 {
        assert!(validate_arithmetic("2 + 3", 5.0));
        assert!(validate_arithmetic("0 + 0", 0.0));
        assert!(validate_arithmetic("999 + 1", 1000.0));
    }
}

#[test]
fn purity_arithmetic_subtraction_always_same() {
    for _ in 0..100 {
        assert!(validate_arithmetic("10 - 4", 6.0));
        assert!(validate_arithmetic("0 - 5", -5.0));
        assert!(validate_arithmetic("100 - 100", 0.0));
    }
}

#[test]
fn purity_arithmetic_multiplication_always_same() {
    for _ in 0..100 {
        assert!(validate_arithmetic("7 * 8", 56.0));
        assert!(validate_arithmetic("0 * 999", 0.0));
        assert!(validate_arithmetic("1 * 1", 1.0));
    }
}

#[test]
fn purity_arithmetic_division_always_same() {
    for _ in 0..100 {
        assert!(validate_arithmetic("15 / 3", 5.0));
        assert!(validate_arithmetic("10 / 2", 5.0));
        assert!(validate_arithmetic("7 / 2", 3.5));
    }
}

#[test]
fn purity_division_by_zero_always_false() {
    for _ in 0..100 {
        assert!(!validate_arithmetic("5 / 0", 0.0));
        assert!(!validate_arithmetic("5 / 0", f64::INFINITY));
        assert!(!validate_arithmetic("0 / 0", 0.0));
    }
}

#[test]
fn purity_wrong_answers_always_rejected() {
    for _ in 0..100 {
        assert!(!validate_arithmetic("2 + 3", 6.0));
        assert!(!validate_arithmetic("10 - 4", 7.0));
        assert!(!validate_arithmetic("7 * 8", 55.0));
    }
}

// ─── Fraction Purity ─────────────────────────────────────────────────

#[test]
fn purity_fraction_equivalence_always_same() {
    for _ in 0..100 {
        assert!(validate_fraction(1, 2, 2, 4));   // 1/2 == 2/4
        assert!(validate_fraction(3, 4, 6, 8));   // 3/4 == 6/8
        assert!(validate_fraction(1, 3, 2, 6));   // 1/3 == 2/6
        assert!(validate_fraction(5, 10, 1, 2));  // 5/10 == 1/2
    }
}

#[test]
fn purity_fraction_inequality_always_same() {
    for _ in 0..100 {
        assert!(!validate_fraction(1, 3, 1, 4));  // 1/3 != 1/4
        assert!(!validate_fraction(2, 3, 3, 4));  // 2/3 != 3/4
        assert!(!validate_fraction(1, 2, 1, 3));  // 1/2 != 1/3
    }
}

#[test]
fn purity_fraction_zero_denominator_always_false() {
    for _ in 0..100 {
        assert!(!validate_fraction(1, 0, 1, 2));
        assert!(!validate_fraction(1, 2, 1, 0));
        assert!(!validate_fraction(0, 0, 0, 0));
    }
}

#[test]
fn purity_simplify_fraction_always_same() {
    for _ in 0..100 {
        assert_eq!(simplify_fraction(4, 8), vec![1, 2]);
        assert_eq!(simplify_fraction(6, 9), vec![2, 3]);
        assert_eq!(simplify_fraction(15, 25), vec![3, 5]);
        assert_eq!(simplify_fraction(7, 7), vec![1, 1]);
        assert_eq!(simplify_fraction(12, 4), vec![3, 1]);
    }
}

#[test]
fn purity_simplify_fraction_zero_denominator() {
    for _ in 0..100 {
        assert_eq!(simplify_fraction(5, 0), vec![0, 0]);
    }
}

#[test]
fn purity_simplify_fraction_negative_numbers() {
    for _ in 0..100 {
        // Negative denominator should normalize sign
        let result = simplify_fraction(3, -6);
        assert_eq!(result, vec![-1, 2]);
    }
}

// ─── Equation Purity ─────────────────────────────────────────────────

#[test]
fn purity_equation_validation_always_same() {
    for _ in 0..100 {
        // Engine supports single-operator equations: "x op b = c"
        assert!(validate_equation("x + 1 = 3", 2.0));
        assert!(validate_equation("x * 3 = 12", 4.0));
        assert!(validate_equation("x - 5 = 10", 15.0));
    }
}

#[test]
fn purity_equation_wrong_value_always_rejected() {
    for _ in 0..100 {
        assert!(!validate_equation("x + 1 = 3", 5.0));
        assert!(!validate_equation("x * 3 = 12", 2.0));
        assert!(!validate_equation("x - 5 = 10", 0.0));
    }
}

// ─── check_answer JSON Purity ────────────────────────────────────────

#[test]
fn purity_check_answer_correct_always_same_json() {
    for _ in 0..100 {
        let result = check_answer("arithmetic", "2 + 3", "5");
        assert!(result.contains("\"correct\":true"));
        assert!(result.contains("\"hint\":\"Correct!\""));
    }
}

#[test]
fn purity_check_answer_incorrect_always_same_json() {
    for _ in 0..100 {
        let result = check_answer("arithmetic", "2 + 3", "6");
        assert!(result.contains("\"correct\":false"));
        assert!(result.contains("Try evaluating"));
    }
}

#[test]
fn purity_check_answer_fraction_correct() {
    for _ in 0..100 {
        let result = check_answer("fraction", "1/2", "2/4");
        assert!(result.contains("\"correct\":true"));
    }
}

#[test]
fn purity_check_answer_fraction_incorrect() {
    for _ in 0..100 {
        let result = check_answer("fraction", "1/2", "1/3");
        assert!(result.contains("\"correct\":false"));
    }
}

#[test]
fn purity_check_answer_unknown_type() {
    for _ in 0..100 {
        let result = check_answer("unknown_type", "x", "y");
        assert!(result.contains("\"correct\":false"));
        assert!(result.contains("Unknown problem type"));
    }
}

// ─── batch_validate Purity ───────────────────────────────────────────

#[test]
fn purity_batch_validate_always_same() {
    for _ in 0..100 {
        assert_eq!(batch_validate("2 + 3;4 * 5;10 / 2", "5;20;5"), 3);
        assert_eq!(batch_validate("2 + 3;4 * 5", "5;21"), 1);
        assert_eq!(batch_validate("1 + 1", "3"), 0);
    }
}

#[test]
fn purity_batch_validate_mismatched_lengths() {
    for _ in 0..100 {
        assert_eq!(batch_validate("1 + 1;2 + 2", "2"), 0);
    }
}

// ─── Determinism Stress Test ─────────────────────────────────────────
// Run the entire battery and collect results. They must be identical
// on every iteration, making this safe for `git bisect run`.

#[test]
fn determinism_full_battery() {
    let mut results: Vec<String> = Vec::new();

    // Collect results from first run
    results.push(format!("{}", validate_arithmetic("2 + 2", 4.0)));
    results.push(format!("{}", validate_arithmetic("10 - 3", 7.0)));
    results.push(format!("{}", validate_arithmetic("6 * 7", 42.0)));
    results.push(format!("{}", validate_arithmetic("15 / 3", 5.0)));
    results.push(format!("{}", validate_fraction(1, 2, 2, 4)));
    results.push(format!("{}", validate_fraction(3, 4, 6, 8)));
    results.push(format!("{:?}", simplify_fraction(4, 8)));
    results.push(format!("{:?}", simplify_fraction(6, 9)));
    results.push(format!("{}", validate_equation("x + 1 = 2", 1.0)));
    results.push(check_answer("arithmetic", "2 + 3", "5"));
    results.push(format!("{}", batch_validate("2 + 3;4 * 5", "5;20")));

    // Run 99 more times and compare
    for iteration in 1..100 {
        let mut current: Vec<String> = Vec::new();
        current.push(format!("{}", validate_arithmetic("2 + 2", 4.0)));
        current.push(format!("{}", validate_arithmetic("10 - 3", 7.0)));
        current.push(format!("{}", validate_arithmetic("6 * 7", 42.0)));
        current.push(format!("{}", validate_arithmetic("15 / 3", 5.0)));
        current.push(format!("{}", validate_fraction(1, 2, 2, 4)));
        current.push(format!("{}", validate_fraction(3, 4, 6, 8)));
        current.push(format!("{:?}", simplify_fraction(4, 8)));
        current.push(format!("{:?}", simplify_fraction(6, 9)));
        current.push(format!("{}", validate_equation("x + 1 = 2", 1.0)));
        current.push(check_answer("arithmetic", "2 + 3", "5"));
        current.push(format!("{}", batch_validate("2 + 3;4 * 5", "5;20")));

        assert_eq!(
            results, current,
            "Determinism violation on iteration {}! Results differ from first run.",
            iteration
        );
    }
}
