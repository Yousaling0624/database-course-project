package database

import (
	"log"
	"os"
	"sync"

	"github.com/yousaling0624/database-course-project/backend/internal/config"
	"github.com/yousaling0624/database-course-project/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	DB          *gorm.DB
	IsConnected bool
	dbMutex     sync.RWMutex
)

// TryConnect attempts to connect to database, returns error instead of fatal
func TryConnect() error {
	dbMutex.Lock()
	defer dbMutex.Unlock()

	// Try to load config
	cfg, err := config.Load()
	if err != nil {
		log.Printf("Failed to load config: %v", err)
	}

	// Build DSN
	var dsn string
	if cfg != nil {
		dsn = cfg.Database.GetDSN()
	} else if tempDSN := os.Getenv("DSN"); tempDSN != "" {
		dsn = tempDSN
	} else {
		// Default DSN
		dsn = "root:root@tcp(127.0.0.1:3306)/pharma_db?charset=utf8mb4&parseTime=True&loc=PRC"
	}

	// Try to connect
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		IsConnected = false
		log.Printf("Failed to connect to database: %v", err)
		return err
	}

	IsConnected = true
	log.Println("Database connected successfully")

	// Auto Migrate
	err = DB.AutoMigrate(
		&model.User{},
		&model.Medicine{},
		&model.Customer{},
		&model.Supplier{},
		&model.Inbound{},
		&model.Sales{},
	)
	if err != nil {
		log.Printf("Failed to migrate database: %v", err)
		return err
	}

	seedAdmin()

	return nil
}

// Reconnect attempts to reconnect with new DSN
func Reconnect(dsn string) error {
	dbMutex.Lock()
	defer dbMutex.Unlock()

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		IsConnected = false
		log.Printf("Failed to reconnect to database: %v", err)
		return err
	}

	IsConnected = true
	log.Println("Database reconnected successfully")

	// Auto Migrate
	err = DB.AutoMigrate(
		&model.User{},
		&model.Medicine{},
		&model.Customer{},
		&model.Supplier{},
		&model.Inbound{},
		&model.Sales{},
	)
	if err != nil {
		log.Printf("Failed to migrate database: %v", err)
		return err
	}

	seedAdmin()

	return nil
}

// TestConnection tests a DSN without changing the current connection
func TestConnection(dsn string) error {
	testDB, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return err
	}

	// Close the test connection
	sqlDB, err := testDB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Connect is kept for backward compatibility
func Connect() {
	if err := TryConnect(); err != nil {
		log.Printf("Database not available, running in config mode: %v", err)
	}
}

func seedAdmin() {
	var user model.User
	result := DB.Where("username = ?", "admin").First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		// Create admin only if it doesn't exist
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
		admin := model.User{
			Username: "admin",
			Password: string(hashedPassword),
			Role:     "admin",
		}
		DB.Create(&admin)
		log.Println("Seeded admin user with default password 'password'")
	}
	// If admin exists, do nothing - don't reset password
}
