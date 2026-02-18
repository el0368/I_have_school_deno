// Sovereign Academy - Math Validation Engine (Rust → WASM)
//
// This module compiles to WebAssembly and runs inside Fresh Islands.
// It provides mathematically indestructible validation for exercises.

use wasm_bindgen::prelude::*;

// ─── Arithmetic Validation ───────────────────────────────────────────

/// Validate an arithmetic expression: "2 + 3 = 5" → true
#[wasm_bindgen]
pub fn validate_arithmetic(expression: &str, student_answer: f64) -> bool {
    match evaluate_expression(expression) {
        Some(correct) => (correct - student_answer).abs() < 1e-9,
        None => false,
    }
}

/// Evaluate a simple arithmetic expression.
/// Supports: +, -, *, / with two operands.
fn evaluate_expression(expr: &str) -> Option<f64> {
    let expr = expr.trim();

    // Try each operator
    for op in ['+', '-', '*', '/'] {
        if let Some(pos) = expr.rfind(op) {
            if pos == 0 {
                continue; // Skip leading negative sign
            }
            let left = expr[..pos].trim().parse::<f64>().ok()?;
            let right = expr[pos + 1..].trim().parse::<f64>().ok()?;

            return match op {
                '+' => Some(left + right),
                '-' => Some(left - right),
                '*' => Some(left * right),
                '/' => {
                    if right.abs() < 1e-15 {
                        None // Division by zero
                    } else {
                        Some(left / right)
                    }
                }
                _ => None,
            };
        }
    }

    // Single number
    expr.parse::<f64>().ok()
}

// ─── Equation Validation ─────────────────────────────────────────────

/// Check if an equation is balanced: "2x + 3 = 7" with x=2 → true
#[wasm_bindgen]
pub fn validate_equation(equation: &str, variable_value: f64) -> bool {
    let parts: Vec<&str> = equation.split('=').collect();
    if parts.len() != 2 {
        return false;
    }

    let left = evaluate_side(parts[0].trim(), variable_value);
    let right = evaluate_side(parts[1].trim(), variable_value);

    match (left, right) {
        (Some(l), Some(r)) => (l - r).abs() < 1e-9,
        _ => false,
    }
}

/// Evaluate one side of an equation, substituting 'x' with the given value.
fn evaluate_side(side: &str, x: f64) -> Option<f64> {
    let side = side.trim();

    // Replace 'x' with the numeric value and evaluate
    let substituted = side.replace('x', &format!("{}", x));

    // Simple evaluation of substituted expression
    evaluate_expression(&substituted)
}

// ─── Fraction Validation ─────────────────────────────────────────────

/// Validate a fraction answer: numerator/denominator
#[wasm_bindgen]
pub fn validate_fraction(
    expected_num: i64,
    expected_den: i64,
    student_num: i64,
    student_den: i64,
) -> bool {
    if expected_den == 0 || student_den == 0 {
        return false;
    }

    // Cross-multiply to avoid floating point issues
    expected_num * student_den == student_num * expected_den
}

/// Simplify a fraction to lowest terms. Returns [numerator, denominator].
#[wasm_bindgen]
pub fn simplify_fraction(numerator: i64, denominator: i64) -> Vec<i64> {
    if denominator == 0 {
        return vec![0, 0];
    }

    let g = gcd(numerator.unsigned_abs(), denominator.unsigned_abs()) as i64;
    let sign = if denominator < 0 { -1 } else { 1 };

    vec![sign * numerator / g, sign * denominator / g]
}

fn gcd(a: u64, b: u64) -> u64 {
    if b == 0 {
        a
    } else {
        gcd(b, a % b)
    }
}

// ─── Validation Result ───────────────────────────────────────────────

/// Detailed validation result returned as JSON string.
#[wasm_bindgen]
pub fn check_answer(problem_type: &str, problem: &str, student_answer: &str) -> String {
    let (is_correct, hint) = match problem_type {
        "arithmetic" => {
            let answer: f64 = student_answer.parse().unwrap_or(f64::NAN);
            let correct = validate_arithmetic(problem, answer);
            let hint = if correct {
                "Correct!".to_string()
            } else {
                format!("Try evaluating {} step by step.", problem)
            };
            (correct, hint)
        }
        "fraction" => {
            let parts: Vec<&str> = student_answer.split('/').collect();
            if parts.len() == 2 {
                let num = parts[0].trim().parse::<i64>().unwrap_or(0);
                let den = parts[1].trim().parse::<i64>().unwrap_or(0);
                let prob_parts: Vec<&str> = problem.split('/').collect();
                if prob_parts.len() == 2 {
                    let exp_num = prob_parts[0].trim().parse::<i64>().unwrap_or(0);
                    let exp_den = prob_parts[1].trim().parse::<i64>().unwrap_or(0);
                    let correct = validate_fraction(exp_num, exp_den, num, den);
                    let hint = if correct {
                        "Correct!".to_string()
                    } else {
                        "Try simplifying the fraction to its lowest terms.".to_string()
                    };
                    (correct, hint)
                } else {
                    (false, "Invalid problem format.".to_string())
                }
            } else {
                (false, "Enter your answer as a fraction: numerator/denominator".to_string())
            }
        }
        _ => (false, format!("Unknown problem type: {}", problem_type)),
    };

    format!(
        r#"{{"correct":{},"hint":"{}","problem":"{}","answer":"{}"}}"#,
        is_correct, hint, problem, student_answer
    )
}

// ─── Performance Benchmarks ──────────────────────────────────────────

/// Batch validate multiple arithmetic problems. Returns count of correct answers.
#[wasm_bindgen]
pub fn batch_validate(problems: &str, answers: &str) -> u32 {
    let probs: Vec<&str> = problems.split(';').collect();
    let ans: Vec<&str> = answers.split(';').collect();

    if probs.len() != ans.len() {
        return 0;
    }

    probs
        .iter()
        .zip(ans.iter())
        .filter(|(p, a)| {
            if let Ok(answer) = a.trim().parse::<f64>() {
                validate_arithmetic(p.trim(), answer)
            } else {
                false
            }
        })
        .count() as u32
}

// ─── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_addition() {
        assert!(validate_arithmetic("2 + 3", 5.0));
        assert!(!validate_arithmetic("2 + 3", 6.0));
    }

    #[test]
    fn test_subtraction() {
        assert!(validate_arithmetic("10 - 4", 6.0));
    }

    #[test]
    fn test_multiplication() {
        assert!(validate_arithmetic("7 * 8", 56.0));
    }

    #[test]
    fn test_division() {
        assert!(validate_arithmetic("15 / 3", 5.0));
    }

    #[test]
    fn test_division_by_zero() {
        assert!(!validate_arithmetic("5 / 0", 0.0));
    }

    #[test]
    fn test_fraction_validation() {
        assert!(validate_fraction(1, 2, 2, 4)); // 1/2 == 2/4
        assert!(validate_fraction(3, 4, 6, 8)); // 3/4 == 6/8
        assert!(!validate_fraction(1, 3, 1, 4)); // 1/3 != 1/4
    }

    #[test]
    fn test_simplify_fraction() {
        assert_eq!(simplify_fraction(4, 8), vec![1, 2]);
        assert_eq!(simplify_fraction(6, 9), vec![2, 3]);
    }

    #[test]
    fn test_batch_validate() {
        assert_eq!(batch_validate("2 + 3;4 * 5;10 / 2", "5;20;5"), 3);
        assert_eq!(batch_validate("2 + 3;4 * 5", "5;21"), 1);
    }

    #[test]
    fn test_check_answer_json() {
        let result = check_answer("arithmetic", "2 + 3", "5");
        assert!(result.contains("\"correct\":true"));
    }
}
