package config

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

// DatabaseConfig holds MySQL connection settings
type DatabaseConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	Database string `json:"database"`
}

// Config holds all application configuration
type Config struct {
	Database DatabaseConfig `json:"database"`
}

var (
	current     *Config
	configPath  = "config.json"
	configMutex sync.RWMutex
)

// SetConfigPath allows changing the config file path (useful for testing)
func SetConfigPath(path string) {
	configMutex.Lock()
	defer configMutex.Unlock()
	configPath = path
}

// Load reads config from file, returns nil if file doesn't exist
func Load() (*Config, error) {
	configMutex.Lock()
	defer configMutex.Unlock()

	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil // No config file yet
		}
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	current = &cfg
	return &cfg, nil
}

// Save writes config to file
func Save(cfg *Config) error {
	configMutex.Lock()
	defer configMutex.Unlock()

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(configPath, data, 0600); err != nil {
		return err
	}

	current = cfg
	return nil
}

// Get returns current config (may be nil)
func Get() *Config {
	configMutex.RLock()
	defer configMutex.RUnlock()
	return current
}

// GetDSN builds MySQL DSN from config
func (c *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.User, c.Password, c.Host, c.Port, c.Database)
}

// Default returns default local MySQL config
func Default() *Config {
	return &Config{
		Database: DatabaseConfig{
			Host:     "mysql",
			Port:     3306,
			User:     "root",
			Password: "root",
			Database: "pharma_db",
		},
	}
}
