import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        'error': '0 0 15px rgba(220, 38, 38, 0.8)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // VoIP call status colors
        status: {
          inactive: "#9ca3af",   // Gray for inactive lines
          ringing: "#fbbf24",    // Amber for ringing calls
          active: "#22c55e",     // Green for active calls
          holding: "#f59e0b",    // Darker amber for calls on hold
          onair: "#ef4444",      // Red for calls that are on air
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slow-blink": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.4",
          }
        },
        "timer-blink": {
          "0%": {
            opacity: "1",
            filter: "brightness(1.8)",
            transform: "scale(1.1)",
          },
          "50%": {
            opacity: "0.3",
            filter: "brightness(0.8)",
            transform: "scale(0.96)",
          },
          "100%": {
            opacity: "1",
            filter: "brightness(1.8)",
            transform: "scale(1.1)",
          }
        },
        "timer-glow": {
          "0%": {
            filter: "drop-shadow(0 0 8px rgba(255, 0, 0, 0.7))",
          },
          "50%": {
            filter: "drop-shadow(0 0 20px rgba(255, 0, 0, 1))",
          },
          "100%": {
            filter: "drop-shadow(0 0 8px rgba(255, 0, 0, 0.7))",
          }
        },
        "container-pulse": {
          "0%": {
            boxShadow: "0 0 5px rgba(255, 0, 0, 0.8) inset, 0 0 8px rgba(255, 0, 0, 0.5)",
            backgroundColor: "rgba(35, 0, 0, 0.95)",
          },
          "50%": {
            boxShadow: "0 0 12px rgba(255, 0, 0, 0.9) inset, 0 0 15px rgba(255, 0, 0, 0.8)",
            backgroundColor: "rgba(45, 0, 0, 1)",
          },
          "100%": {
            boxShadow: "0 0 5px rgba(255, 0, 0, 0.8) inset, 0 0 8px rgba(255, 0, 0, 0.5)",
            backgroundColor: "rgba(35, 0, 0, 0.95)",
          }
        },
        "on-air-pulse": {
          "0%": {
            backgroundColor: "rgb(185, 28, 28)",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.9)",
            transform: "scale(1)",
          },
          "50%": {
            backgroundColor: "rgb(239, 68, 68)",
            boxShadow: "0 0 35px rgba(239, 68, 68, 0.8)",
            transform: "scale(1.03)",
          },
          "100%": {
            backgroundColor: "rgb(185, 28, 28)",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.9)",
            transform: "scale(1)",
          },
        },
        "connection-pulse": {
          "0%": {
            transform: "scale(1)",
            opacity: "0.8",
          },
          "70%": {
            transform: "scale(1.5)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "0",
          }
        },
        "connection-blink": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.4",
          }
        },
        "connection-wave": {
          "0%": {
            boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.6)",
          },
          "70%": {
            boxShadow: "0 0 0 8px rgba(59, 130, 246, 0)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)",
          }
        },
        "power-warning": {
          "0%": {
            opacity: "1",
            filter: "brightness(1.2)",
          },
          "50%": {
            opacity: "0.7",
            filter: "brightness(0.8)",
          },
          "100%": {
            opacity: "1",
            filter: "brightness(1.2)",
          }
        },
        "audio-bounce-low": {
          "0%, 100%": {
            transform: "scaleY(1.01)",
          },
          "50%": {
            transform: "scaleY(0.97)",
          }
        },
        "audio-bounce-medium": {
          "0%, 100%": {
            transform: "scaleY(1.03)",
          },
          "50%": {
            transform: "scaleY(0.94)",
          }
        },
        "audio-bounce-high": {
          "0%, 100%": {
            transform: "scaleY(1.05)",
          },
          "25%": {
            transform: "scaleY(0.9)",
          },
          "75%": {
            transform: "scaleY(0.95)",
          }
        },
        "needle-warning": {
          "0%": {
            stroke: "red",
            strokeWidth: "2",
          },
          "50%": {
            stroke: "rgb(254, 202, 202)",
            strokeWidth: "3",
          },
          "100%": {
            stroke: "red",
            strokeWidth: "2",
          }
        },
        "pulse-error": {
          "0%": {
            borderColor: "rgb(185, 28, 28)",
            boxShadow: "0 0 10px rgba(239, 68, 68, 0.7)",
          },
          "50%": {
            borderColor: "rgb(254, 202, 202)",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.9)",
          },
          "100%": {
            borderColor: "rgb(185, 28, 28)",
            boxShadow: "0 0 10px rgba(239, 68, 68, 0.7)",
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "on-air-blink": "on-air-pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse": "connection-pulse 2s cubic-bezier(0, 0.55, 0.45, 1) infinite",
        "pulse-slow": "connection-pulse 3s cubic-bezier(0, 0.55, 0.45, 1) infinite",
        "pulse-medium": "connection-pulse 1.8s cubic-bezier(0, 0.55, 0.45, 1) infinite",
        "pulse-fast": "connection-pulse 1.2s cubic-bezier(0, 0.55, 0.45, 1) infinite",
        "pulse-error": "pulse-error 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blink": "connection-blink 1.5s ease-in-out infinite",
        "blink-fast": "timer-blink 0.6s ease-in-out infinite",
        "slow-blink": "slow-blink 2s ease-in-out infinite",
        "timer-glow": "timer-glow 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "container-pulse": "container-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave": "connection-wave 2s infinite",
        "power-warning": "power-warning 1s ease-in-out infinite",
        "needle-warning": "needle-warning 1s ease-in-out infinite",
        "audio-low": "audio-bounce-low 4s ease-in-out infinite",
        "audio-medium": "audio-bounce-medium 2.5s ease-in-out infinite",
        "audio-high": "audio-bounce-high 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
