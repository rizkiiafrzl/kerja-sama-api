package utils

import (
	"regexp"
	"strings"
)

// ValidatePhone validates phone number: only digits, max 13 characters
func ValidatePhone(phone string) error {
	if phone == "" {
		return nil // Phone is optional
	}

	// Remove spaces and dashes for validation
	cleaned := strings.ReplaceAll(phone, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, "(", "")
	cleaned = strings.ReplaceAll(cleaned, ")", "")

	// Check if only digits
	matched, err := regexp.MatchString(`^[0-9]+$`, cleaned)
	if err != nil {
		return err
	}
	if !matched {
		return &ValidationError{Field: "pic_phone", Message: "phone number must contain only digits"}
	}

	// Check max length (13 digits)
	if len(cleaned) > 13 {
		return &ValidationError{Field: "pic_phone", Message: "phone number must be maximum 13 digits"}
	}

	return nil
}

// NormalizePhone removes spaces, dashes, and parentheses from phone number
func NormalizePhone(phone string) string {
	if phone == "" {
		return ""
	}
	cleaned := strings.ReplaceAll(phone, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, "(", "")
	cleaned = strings.ReplaceAll(cleaned, ")", "")
	return cleaned
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
