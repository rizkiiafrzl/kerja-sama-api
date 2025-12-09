package utils

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// GenerateCompanyCode generates a company code from company name and sequence
// Format: PT-XXX-001 (where XXX is first 3 letters of first word)
func GenerateCompanyCode(companyName string) string {
	parts := strings.Fields(companyName)
	code := "XXX"

	if len(parts) > 0 {
		word := strings.ToUpper(parts[0])
		// Remove non-alphanumeric characters
		word = strings.Map(func(r rune) rune {
			if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
				return r
			}
			return -1
		}, word)

		if len(word) >= 3 {
			code = word[:3]
		} else if len(word) > 0 {
			code = fmt.Sprintf("%-3s", word)
			code = strings.ReplaceAll(code, " ", "X")
		}
	}

	// Add random suffix to ensure uniqueness
	suffix := uuid.New().String()[:3]
	return fmt.Sprintf("PT-%s-%s", code, strings.ToUpper(suffix))
}

// GeneratePKSNumber generates a PKS number
// Format: PKS-YYYY-XXXX (where YYYY is year and XXXX is random)
func GeneratePKSNumber() string {
	year := time.Now().Year()
	suffix := uuid.New().String()[:8]
	return fmt.Sprintf("PKS-%d-%s", year, strings.ToUpper(suffix))
}

// GenerateAPIKey generates a random API key
func GenerateAPIKey() string {
	return uuid.New().String()
}
